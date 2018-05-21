<!-- markdownlint-disable first-line-h1 -->
<!-- markdownlint-disable no-inline-html -->
<!-- markdownlint-disable ul-indent -->

[![Build Status](https://travis-ci.org/jschnurr/botkit-middleware-dialogflow.svg?branch=master)](https://travis-ci.org/jschnurr/botkit-middleware-dialogflow)

# Botkit Middleware Dialogflow

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to integrate [Google Dialogflow](https://dialogflow.com/) (formerly [api.ai](https://api.ai)) with social platforms like Slack, Facebook and Twilio.

Dialogflow's Natural Language Processing (NLP) platform transforms real-world user input into structured
**intents** and **entities**, and can optionally trigger **actions** and **fulfillment (webhooks)**. Configuration
and training are done in the convenient and powerful [Dialogflow Console](https://console.dialogflow.com/), with
the results being immediately available to your bot.

## Installation

```bash
npm install botkit-middleware-dialogflow --save
```

## Function Overview

### [Receive Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md#receive-middleware)

*   `middleware.receive`: used to send the message content to Dialogflow, and add results to the message object.

### [Hear Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md#hear-middleware)

*   `middleware.hears`: matches intent names as configured in [Dialogflow Console](https://console.dialogflow.com/)
*   `middleware.action`: matches action names configured in [Dialogflow Console](https://console.dialogflow.com/)

## Usage

### Create a Dialogflow Agent

To get started, [sign up for an account](https://console.dialogflow.com/api-client/#/login), and explore the
[Dialogflow Console](https://console.dialogflow.com/).

Next, create an [agent](https://dialogflow.com/docs/agents). Agents represent your bots' NLU (Natural Language
Understanding). Your bot will interact with your agent through the [Dialogflow API](https://dialogflow.com/docs/reference/agent/).

The API keys can be found in the [agent settings](https://dialogflow.com/docs/agents#settings). Note the
_Client access token_; this will be required by your bot.

<p align="center">
  <img src="images/tokens.png" />
</p>
<br>

### Configure a Channel

This document shows code snippets using [Slack](https://github.com/howdyai/botkit/blob/master/docs/readme-slack.md) with the middleware. See the `examples` folder for how to configure a basic bot on your preferred service.

### Bot Setup

Let's walk through the code in the `examples/slack_bot.js` file.

Let's start with Botkit. That's the main engine.

```javascript
var Botkit = require('botkit');
```

Create a Slack controller using Botkit:

```javascript
var slackController = Botkit.slackbot({
    debug: true,
});
```

Spawn a Slack bot using the controller:

```javascript
var slackBot = slackController.spawn({
    token: process.env.token,
});
```

Create a middleware object which we'll be attaching to the controller:

```javascript
var options = {
    token: process.env.dialogflow,
};
var dialogflowMiddleware = require('botkit-middleware-dialogflow')(options);
```

Tell your Slackbot to use the middleware when it receives a message:

```javascript
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();
```

Finally, make your bot listen for the intent you configured in the Dialogflow Agent. Notice we
are listening for `hello-intent` - that's the name we gave the intent in the [Dialogflow Console](https://console.dialogflow.com/).

Patterns can be provided as an array or a comma separated string containing a list of regular expressions to match.

```javascript
// listen for literal string 'hello-intent' (case insensitive)
slackController.hears('hello-intent', 'direct_message', dialogflowMiddleware.hears, function(
    bot,
    message
) {
    bot.reply(message, 'Hello!');
});
```

or

```javascript
// listen for literal string 'hello-intent', or anything beginning with "HELLO" (case insensitive)
slackController.hears(
    ['hello-intent', /^HELLO.*/i],
    'direct_message',
    dialogflowMiddleware.hears,
    function(bot, message) {
        bot.reply(message, 'Hello!');
    }
);
```

or

```javascript
// listen for comma-separated 'hello-intent' or 'greeting-intent'
slackController.hears(
    'hello-intent,greeting-intent',
    'direct_message',
    dialogflowMiddleware.hears,
    function(bot, message) {
        bot.reply(message, 'Hello!');
    }
);
```

## What it does

The middleware parses the Dialogflow API response and updates the message object. The raw result of the middleware call to [https://api.dialogflow.com/v1/query](https://dialogflow.com/docs/reference/agent/query) endpoint is made available on the `nlpResponse` property of the message.

The full set of properties available after processing include:

*   `message.intent` for any named intents found as defined in Dialogflow
*   `message.entities` for any language entities defined in Dialogflow (dates, places, etc)
*   `message.fulfillment` for Dialogflow specific speech fulfillment
*   `message.confidence` for the confidence interval
*   `message.nlpResponse` for the raw Dialogflow response.

Here is a diff of a message object, before and after middleware processing.

<p align="center">
  <img src="images/diff.png" />
</p>
<br>

# Features

## Options

When creating the middleware object, pass an options object with the following parameters.

| Property           | Required |    Default     | Description                                                                                                                                                                                                                          |
| ------------------ | :------- | :------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| token              | Yes      |      N/A       | Client access token, from the Dialogflow Console.                                                                                                                                                                                    |
| ignoreType         | No       | 'self_message' | Skip Dialogflow processing if the `type` matches the pattern. Useful to avoid unneccessary API calls. Patterns can be provided as a string, regex, or array of either.                                                               |
| minimum_confidence | No       |      0.5       | Dialogflow returns a confidence (in the range 0.0 to 1.0) for each matching intent. This value is the cutoff - the `hears` and `action` middleware will only return a match for confidence values equal or greather than this value. |

## Entities

Dialogflow has the ability to extract entities (dates, places, etc) from user input. If you have configured your Agent this way,
any entities found will be available on the message.entities property.

## Language

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

# Change Log

*   7-May-2018 v1.3.0

    *   fix #9 add support for ignoreType to avoid unneccessary API calls to DF
    *   docs: more debugging tips
    *   docs: restore images in readme

*   31-Mar-2018 v1.2.0

    *   fix #5 add full support for regex and strings for intents and actions
    *   change slack example env variable to improve clarity
    *   add tests for existing functionality

*   9-Dec-2017 v1.1.0

    *   BREAKING update criteria for skipping middleware automatically
    *   BREAKING remove skip_bot option
    *   fix linting errors
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

# Credit

Forked from [botkit-middleware-apiai](https://github.com/abeai/botkit-middleware-apiai). Thanks to
[@abeai](https://github.com/abeai) for the original work.

# License

This library is licensed under the MIT license. Full text is available in LICENSE.
