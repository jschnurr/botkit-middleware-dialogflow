# Botkit Middleware Apiai
This middleware plugin for [Botkit](http://howdy.ai/botkit) allows you to utilize [Api.ai](http://api.ai), a natural language classifier service directly into the Botkit corebot.

The Api.ai platform lets developers seamlessly integrate intelligent voice and text based command systems into their products to create consumer-friendly voice/text-enabled user interfaces.

## Setup
In order to utilize api.ai's service you will need to create an account and an agent. An agent will represent your Bot's comprehension skills. Head over to their [sign up page](https://console.api.ai/api-client/#/signup) to get started. After creating an account you will be able to create your first agent and start creating intents. Grab the *developer access token* for your local dev and a *client access token* for production as seen below

![Api.ai Tokens](http://s33.postimg.org/6areug03j/apiai.jpg)

Next you will need to add botkit-middleware-apiai as a dependency to your Botkit bot:

```
npm install --save botkit-middleware-apiai
```

Enable the middleware:
```
var apiai = require('botkit-middleware-apiai')({
    token: <my_apiai_token>
});

controller.middleware.receive.use(apiai.receive);

controller.hears(['hello'],'direct_message',apiai.hears,function(bot, message) {
    // ...
});
```

## What it does

Using the Api.ai middleware with Botkit causes every message sent to your bot to be first sent through Api.ai's NLP services for processing. The response from Api.ai is then returned in the incoming messages as `message.intent`, `message.entities` for any language entities (dates, places, etc), `message.fulfillment` for Api.ai specific speech fulfillment, `message.confidence` for the confidence interval, and finally the `message.nlpResponse` which represents the raw request as seen below:

    {
      "id": "XXXX",
      "timestamp": "2016-05-31T18:20:38.992Z",
      "result": {
        "source": "agent",
        "resolvedQuery": "hello",
        "action": "",
        "actionIncomplete": false,
        "parameters": {},
        "contexts": [],
        "metadata": {
          "intentId": "XXX",
          "webhookUsed": "false",
          "intentName": "hello"
        },
        "fulfillment": {
          "speech": ""
        },
        "score": 1
      },
      "status": {
        "code": 200,
        "errorType": "success"
      }
    }
