# Botkit Middleware Dialogflow
This middleware plugin for [Botkit](http://howdy.ai/botkit) allows you to utilize [Dialogflow](https://dialogflow.com/)
(formerly [api.ai](https://api.ai), a natural language classifier service directly into the Botkit corebot.

The Dialogflow platform lets developers seamlessly integrate intelligent voice and text based command systems into their products to create consumer-friendly voice/text-enabled user interfaces.

## Setup
In order to utilize Dialogflow's service you will need to create an account and an agent. An agent will represent your Bots comprehension skills. Head over to their [sign up page](https://console.dialogflow.com/api-client/#/login) to get started. After creating an account you will be able to create your first agent and start creating intents. Grab the *developer access token* for your local dev and a *client access token* for production as seen below

![Dialogflow Tokens](https://s8.postimg.org/bgepzb4d1/tokens.png)

Next you will need to add botkit-middleware-dialogflow as a dependency to your Botkit bot:

```
npm install --save botkit-middleware-dialogflow
```

Enable the middleware:
```javascript
var dialogflow = require('botkit-middleware-dialogflow')({
    token: <my_dialogflow_token>,
    skip_bot: true // false. If true, the middleware doesn't send the bot reply/says to Dialogflow
});

controller.middleware.receive.use(dialogflow.receive);

// dialogflow.hears for intents. in this example 'hello' is the intent
controller.hears(['hello'],'direct_message',dialogflow.hears,function(bot, message) {
    // ...
});

// dialogflow.action for actions. in this example 'user.setName' is the action
controller.hears(['user.setName'],'direct_message',dialogflow.action,function(bot, message) {
    // ...
});
```

## What it does

Using the Dialogflow middleware with Botkit causes every message sent to your bot to be first sent through Dialogflow's NLP services for processing. The response from Dialogflow is then returned in the incoming messages as the following properties:
- `message.intent`
- `message.entities` for any language entities (dates, places, etc)
- `message.fulfillment` for Dialogflow specific speech fulfillment
- `message.confidence` for the confidence interval
- `message.nlpResponse` for the raw request, as seen below:

```json
{
  "id": "18ae5775-f95f-4f8f-a4de-85a9199d5048",
  "timestamp": "2017-12-04T03:02:36.824Z",
  "lang": "en",
  "result": {
    "source": "agent",
    "resolvedQuery": "Hello!",
    "action": "",
    "actionIncomplete": false,
    "parameters": {},
    "contexts": [],
    "metadata": {
      "intentId": "2812178c-edea-4403-8767-2a051fbe951b",
      "webhookUsed": "false",
      "webhookForSlotFillingUsed": "false",
      "intentName": "hello"
    },
    "fulfillment": {
      "speech": "",
      "messages": [
        {
          "type": 0,
          "speech": ""
        }
      ]
    },
    "score": 1
  },
  "status": {
    "code": 200,
    "errorType": "success",
    "webhookTimedOut": false
  },
  "sessionId": "91d34030-d89f-11e7-8471-e54c58f90eba"
}
```

Forked from [botkit-middleware-apiai](https://github.com/abeai/botkit-middleware-apiai). Thanks to
[@abeai](https://github.com/abeai) for the original work.