/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Get a Api.ai token from api.ai

    -> https://console.api.ai/api-client/#/editAgent/<your-agent-id>

  Run your bot from the command line:

    apiai=<api-token> token=<token> node apiai_example_bot.js

# USE THE BOT:

  Train a "hello" intent inside Api.ai.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the api.ai console!

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.apiai) {
    console.log('Error: Specify apiai in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var apiai = require('./src/botkit-middleware-apiai')({
    token: process.env.apiai,
});


var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();
console.log(apiai);
controller.middleware.receive.use(apiai.receive);


/* note this uses example middlewares defined above */
controller.hears(['hello'], 'direct_message,direct_mention,mention', apiai.hears, function(bot, message) {
    console.log(JSON.stringify(message));
    console.log('hello');
    bot.reply(message, 'Hello!');
});
