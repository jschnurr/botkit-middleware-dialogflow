<!-- markdownlint-disable first-line-h1 -->
<!-- markdownlint-disable no-inline-html -->

[![Build Status](https://travis-ci.org/jschnurr/botkit-middleware-dialogflow.svg?branch=master)](https://travis-ci.org/jschnurr/botkit-middleware-dialogflow)

# Botkit Middleware Dialogflow

A middleware plugin for [Botkit](http://howdy.ai/botkit) that allows developers to integrate with [Google Dialogflow](https://dialogflow.com/), leveraging the power of both to build chatbot applications on Node for social platforms like Slack, Facebook and Twilio.

Dialogflow's Natural Language Processing (NLP) platform transforms real-world user input into structured
**intents** and **entities**, and can optionally trigger **actions** and **fulfillment** (webhooks). Configuration
and training are done in the convenient and powerful [Dialogflow Console](https://console.dialogflow.com/), with
the results being immediately available to your bot.

- [Botkit Middleware Dialogflow](#botkit-middleware-dialogflow)
    - [Installation](#installation)
    - [Migrating from earlier versions](#migrating-from-earlier-versions)
    - [Quick Start](#quick-start)
        - [1. Setup an Agent in Dialogflow](#1-setup-an-agent-in-dialogflow)
        - [2. Create a service account](#2-create-a-service-account)
        - [3. Add the middleware to your Bot](#3-add-the-middleware-to-your-bot)
        - [4. Try it out!](#4-try-it-out)
    - [Middleware functions](#middleware-functions)
        - [receive()](#receive)
        - [hears()](#hears)
        - [action()](#action)
    - [Options](#options)
    - [Language Support](#language-support)
    - [Debugging](#debugging)
    - [Legacy V1 API](#legacy-v1-api)
- [Change Log](#change-log)
- [Contributing](#contributing)
- [Credit](#credit)
- [License](#license)

## Installation

```bash
npm install botkit-middleware-dialogflow
```

## Migrating from earlier versions
Dialogflow has two versions of their API. V2 is the standard, and should be the default for new agents.

However, if you need to [migrate](https://dialogflow.com/docs/reference/v1-v2-migration-guide) from Dialogflow API V1, or are upgrading from earlier versions of `botkit-middleware-dialogflow`, consider the following factors:
-  some Botkit `message` properties have changed.
    -  `fulfillment.speech` -> `fulfillment.text`
    -   `action` property is new
    -   `nlpResponse` object structure has changed significantly.
-  V2 users must provide a JSON keyfile instead of an API key for DialogFlow authentication
-  options parameter `minimum_confidence` has been renamed `minimumConfidence` to match the predominant style.

`botkit-middleware-dialogflow` continues to support both versions of the API. Instructions for legacy V1 are [below]((#legacy-v1-api)).

## Quick Start

### 1. Setup an Agent in Dialogflow
<img src="images/default_intent.png" />

Google describes `Agents` as *NLU (Natural Language Understanding) modules*. They transform natural user requests into structured, actionable data. 

1. In the [Dialogflow Console](https://console.dialogflow.com/), create an [agent](https://dialogflow.com/docs/agents)
2. Choose or create a [Google Cloud Platform (GCP) Project](https://cloud.google.com/docs/overview/#projects).
3. Dialogflow will automatically setup a `Default Welcome Intent`, which you can try from the test console.

### 2. Create a service account
<img src="images/save_json.png" />

In order for your Bot to access your Dialogflow Agent, you will need to create a `service account`. A [Service account](https://cloud.google.com/compute/docs/access/service-accounts) is an identity that allows your bot to access the Dialogflow services on your behalf. Once configured, you can download the private key for your service account as a JSON file.

1. Open the [GCP Cloud Console](https://console.cloud.google.com), and select the project which contains your agent.
2. From the `nav` menu, choose `IAM & admin`, `Service accounts`. 
3. Select `Dialogflow Integrations` (created by default by Dialogflow), or create your own.
4. Under `actions`, select `create key`, select `JSON` and download the file.

### 3. Add the middleware to your Bot
Using Slack (as an example), wire up your Bot to listen for the `Default Welcome Intent`, and then pass along the reply that Dialogflow recommends in `fulfillment.text`.

``` javascript
const Botkit = require('botkit');
const dialogflowMiddleware = require('botkit-middleware-dialogflow')({
  keyFilename: './mybot-service-key.json',  // service account private key file from Google Cloud Console
});

const slackController = Botkit.slackbot();
const slackBot = slackController.spawn({
  token: 'xoxb-082028214871-xEEQbIkyAHH3poFMpUG3dkGW',  // Slack API Token
});

slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();

slackController.hears(['Default Welcome Intent'], 'direct_message', dialogflowMiddleware.hears, function(
  bot,
  message
) {
  replyText = message.fulfillment.text;  // message object has new fields added by Dialogflow
  bot.reply(message, replyText);
});
```

### 4. Try it out!
<img src="images/bot_welcome.png" />

## Middleware functions
`Botkit` supports middleware integration into core bot processes in a few useful places, described [here](https://botkit.ai/docs/middleware.html).

### receive()
Each time the chat platform (eg. Slack, Facebook etc) emits a message to Botkit, `botkit-middleware-dialogflow` uses `receive` middleware to process that message and optionally modify it, before passing it back to Botkit and on down the chain.

#### Setup
First, create an instance of the middleware:

```javascript
const dialogflowMiddleware = require('botkit-middleware-dialogflow')(options);
```

Typically `keyFilename` is the only property of `options` that needs to be set. See [options](#options) section for full list.

Next, tell the `controller` that you want to use the middleware:

```javascript
slackController.middleware.receive.use(dialogflowMiddleware.receive);
```

#### ignoreType
Not every message should be sent to DialogFlow, such as `user_typing` indicators. To avoid these uneccessary calls, `botkit-middleware-dialogflow` allows you to specify which message types to ignore, using the `ignoreType` option.

Since the middleware is part of the [message pipeline](https://botkit.ai/docs/readme-pipeline.html), Botkit has already ingested, normalized and categorized the message by the time we apply this filter. Keep this in mind when choosing which types to ignore.

#### API Call
Assuming the message has passed the `ignoreType` filter, it's sent off to the Dialogflow API for processing. The response is parsed and applied to the `message` object itself.

Specifically, here are the new `message` properties available after processing:

*   `message.intent` [intents](https://dialogflow.com/docs/intents) recognized by Dialogflow (eg. saying 'hi' might trigger the `hello-intent`)
*   `message.entities` [entities](https://dialogflow.com/docs/entities) found as defined in Dialogflow (eg. dates, places, etc)
*   `message.action` [actions and parameters](https://dialogflow.com/docs/actions-and-parameters) triggered by the intent
*   `message.fulfillment` [fulfillment](https://dialogflow.com/docs/fulfillment) triggered by the intent, such as webhooks or text responses.
*   `message.confidence` intent detection confidence. Values range from 0.0 (completely uncertain) to 1.0 (completely certain).
*   `message.nlpResponse` the raw Dialogflow API response.

Here is a diff of a message object, before and after middleware processing.

<img src="images/message_diff.png" />


### hears()
To make your bot listen for the intent name configured in Dialogflow, we need to change the way Botkit "hears" triggers, by passing our middleware into the `hears()` event handler.

For example, using our `dialogflowMiddleware` object defined above:

``` javascript
controller.hears('hello-intent', 'direct_message', dialogflowMiddleware.hears, function(bot, message) {
    // do something
});
```

Notice we are listening for `hello-intent` - that's the name we gave the intent in the [Dialogflow Console](https://console.dialogflow.com/).

Patterns used to match the intent name can be provided as comma seperated strings, regex, or an array of strings and regex.

- `'hello-intent'` // matches hello-intent, HELLO-INTENT case insensitive
- `['hello-intent', /^HELLO.*/i]` // matches hello-intent, hello, or HELLotherejimmy
- `'hello-intent,greeting-intent'` // matches hello-intent or greeting-intent'

Patterns are compared with the `message.intent` property after the `receives()` function has processed it.

### action()
When an intent is triggered, a Dialogflow agent can be configured to take an [action](https://dialogflow.com/docs/actions-and-parameters). The name of the action is captured in the `message.action` property, after procesing by the middleware.

You can setup a `hears()` event handler to trigger on `message.action` as well.

``` javascript
controller.hears('hello-intent', 'direct_message', dialogflowMiddleware.action, function(bot, message) {
    // do something
});
```

The patterns format is the same as `hears()`.


## Options

When creating the middleware object, pass an options object with the following parameters.

| Property          | Required      | Default                       | Description                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | :------------ | :---------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ignoreType        | No            | 'self_message'                | Skip Dialogflow processing if the `type` matches the pattern. Useful to avoid unneccessary API calls. Patterns can be provided as a string, regex, or array of either.                                                                                                                                                                                                                        |
| minimumConfidence | No            | 0.5                           | Dialogflow returns a confidence (in the range 0.0 to 1.0) for each matching intent. This value is the cutoff - the `hears` and `action` middleware will only return a match for confidence values equal or greather than this value.                                                                                                                                                          |
| sessionIdProps    | No            | ['user', 'channel']           | Session ID's help Dialogflow preserve context across multiple calls. By default, this session ID is an MD5 hash of the `user` and `channel` properties on the `message` object. If you'd like to use different properties, provide them as a string or array of strings. If none of the desired properties are available on a `message`, the middleware will use a random session ID instead. |
| lang              | No            | 'en'                          | if the `message` object does not have a `lang` property, this language will be used as the default.                                                                                                                                                                                                                                                                                           |
| version           | No            | v2                            | Version of the dialogflow API to use. Your agent needs to use the same setting for your [agent](https://dialogflow.com/docs/agents) in the DialogFlow console.                                                                                                                                                                                                                                |
| token             | Yes (v1 only) |                               | Client access token, from the Dialogflow Console. Only required with version v1.                                                                                                                                                                                                                                                                                                              |
| keyFilename       | Yes (v2 only) |                               | Path to the a .json key downloaded from the Google Developers Console. Can be relative to where the process is being run from.                                                                                                                                                                                                                                                                |
| projectId         | No  | value of `project_id` in `keyFilename` | The Google project ID your Dialogflow V2 agent belongs to. You can find it in the agent settings. In most cases, your JSON key file will contain it, and the middleware will find it automatically.                                                                                                                                                                                              |
> v2 users can optionally provide a path to a .pem or .p12 `keyFilename`, in which case you must specify an `email` and `projectId` parameter as well.

## Language Support

Dialogflow supports [multi-language agents](https://dialogflow.com/docs/multi-language). If the `message` object has a `lang` value set,
the middleware will send it to Dialogflow and the response will be in that language, if the agent supports it.

By default, Botkit `message` objects do not have a langauge specified, so Dialogflow defaults to `en`.

For example, to invoke the Dialogflow agent in French, set your `message` as such:

```javascript
message.lang = 'fr';
```

## Debugging

To enable debug logging, specify `dialogflow-middleware` in the `DEBUG` environment variable, like this:

```bash
DEBUG=dialogflow-middleware node your_awesome_bot.js
```

By default, objects are only logged to a depth of 2. To recurse indefinitely, set `DEBUG_DEPTH` to `null`, like this:

```bash
DEBUG=dialogflow-middleware DEBUG_DEPTH=null node your_awesome_bot.js
```

## Legacy V1 API
To use the legacy V1 version of the Dialogflow API:

- In the Dialogflow console:
    - In the agent settings, select `V1 API`.
    - Note the `Client access token`.
- Set options for the middleware:
    - `token` is the `Client access token` from the Dialogflow console.
    - `version` should be set to `v1`, telling `botkit-middleware-dialogflow` to use the legacy API.


# Change Log

*   16-July-2018 v2.0.0
    *   refactor to support Dialogflow API V2
    *   readme updates
    *   defaults and examples now use Dialogflow API V2

*   12-June-2018 v1.4.1
    *   sessionId sent to DF based on user and channel properties of message
    *   allow customization of sessionId to use different properties as desired

*   24-May-2018 v1.4.0

    *   support for sending queries to Dialogflow in different languages, specified by lang prop on message
    *   add TOC to README

*   7-May-2018 v1.3.0

    *   fix #9 add support for ignoreType to avoid unneccessary API calls to DF
    *   more debugging tips in README
    *   restore images in readme

*   31-Mar-2018 v1.2.0

    *   fix #5 add full support for regex and strings for intents and actions
    *   change slack example env variable to improve clarity
    *   add tests for existing functionality

*   9-Dec-2017 v1.1.0

    *   update criteria for skipping middleware automatically
    *   remove skip_bot option
    *   travis and changelog added
    *   readme updates
    *   updated examples
    *   filter out self_message type from slack
    *   ignore editor files
    *   migrate to eslint and apply formatter to comply with .eslintrc rules
    *   add debug logging

*   3-Dec-2017 v1.0.1

    *   rebrand as dialogflow

*   pre-fork as botkit-middleware-apiai
    *   initial release

# Contributing
If you would like to help make `botkit-middleware-dialogflow` better, please open an issue in Github, or send me a pull request.

Feedback, suggestions and PRs are welcome.

# Credit

Forked from [botkit-middleware-apiai](https://github.com/abeai/botkit-middleware-apiai). Thanks to
[@abeai](https://github.com/abeai) for the original work.

Also thanks to @ehrhart for patches supporting V2.

# License

This library is licensed under the MIT license. Full text is available in LICENSE.
