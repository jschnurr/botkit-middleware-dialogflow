# Botkit Middleware Dialogflow

This middleware plugin for [Botkit](http://howdy.ai/botkit) allows developers to integrate [Google Dialogflow](https://dialogflow.com/) (formerly [api.ai](https://api.ai)) with social platforms like Slack, Facebook and Twilio.

Dialogflow's Natural Language Processing (NLP) platform transforms real-world user input into structured
**intents** and **entities**, and can optionally trigger **actions** and **fulfillment (webhooks)**. Configuration
and training are done in the convenient and powerful [Dialogflow Console](https://console.dialogflow.com/), with
the results being immediately available to your bot.

## Function Overview

#### [Receive Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md#receive-middleware)

- `middleware.receive`: used to send the message content to Dialogflow, and add results to the message object.

#### [Hear Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md#hear-middleware)

- `middleware.hears`: matches intent names as configured in [Dialogflow Console](https://console.dialogflow.com/)
- `middleware.action`: matches action names configured in [Dialogflow Console](https://console.dialogflow.com/)

## Installation

```bash
npm install botkit-middleware-dialogflow --save
```

## Usage

### Create a Dialogflow Agent

To get started, [sign up for an account](https://console.dialogflow.com/api-client/#/login), and explore the
[Dialogflow Console](https://console.dialogflow.com/).

Next, create an [agent](https://dialogflow.com/docs/agents). Agents represent your bots' NLU (Natural Language
Understanding). Your bot will interact with your agent through the [Dialogflow API](https://dialogflow.com/docs/reference/agent/).

The API keys can be found in the [agent settings](https://dialogflow.com/docs/agents#settings). Note the
*Client access token*; this will be required by your bot.

![Dialogflow Tokens](https://s8.postimg.org/bgepzb4d1/tokens.png)

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
var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});
```

Tell your Slackbot to use the middleware when it receives a message:

```javascript
slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();
```

Finally, make your bot listen for the intent you configured in the Dialogflow Agent. Notice we
are listening for `hello-intent` - that's the name we gave the intent in the [Dialogflow Console](https://console.dialogflow.com/).

```javascript
slackController.hears(['hello-intent'], 'direct_message', dialogflowMiddleware.hears, function(bot, message) {
    bot.reply(message, 'Hello!');
});
```

## What it does

The middleware parses the Dialogflow API response and updates the message object. The raw result of the middleware call to [https://api.dialogflow.com/v1/query](https://dialogflow.com/docs/reference/agent/query) endpoint is made available on the `nlpResponse` property of the message.

The full set of properties available after processing include:
- `message.intent` for any named intents found as defined in Dialogflow
- `message.entities` for any language entities defined in Dialogflow (dates, places, etc)
- `message.fulfillment` for Dialogflow specific speech fulfillment
- `message.confidence` for the confidence interval
- `message.nlpResponse` for the raw Dialogflow response.

Here is a diff of a message object, before and after middleware processing.

![Message Object Diff](https://s8.postimg.org/450f8dak5/message_dif.png)

# Features

## Entities

Dialogflow has the ability to extract entities (dates, places, etc) from user input. If you have configured your Agent this way,
any entities found will be available on the message.entities property.

## Debugging

To enable debug logging, specify `dialogflow-middleware` in the DEBUG environment variable,
like this:

```bash
DEBUG=dialogflow-middleware node your_awesome_bot.js
```

# Credit

Forked from [botkit-middleware-apiai](https://github.com/abeai/botkit-middleware-apiai). Thanks to
[@abeai](https://github.com/abeai) for the original work.

# License

This library is licensed under the MIT license. Full text is available in LICENSE.