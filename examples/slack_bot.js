/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit, using the Dialogflow middleware.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages

# RUN THE BOT:

  Get a Bot API token from Slack:

    -> http://my.slack.com/services/new/bot

  Get a JSON file with your service account key from the Google Cloud Console

    -> https://console.cloud.google.com

  Run your bot from the command line:

    slack=<api-token> dialogflow=<path_to_JSON_file> node example_bot.js

# USE THE BOT:

  Train an intent titled "hello-intent" inside Dialogflow.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the dialogflow console!

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

if (!process.env.slack) {
  console.log('Error: Specify slack API token in environment');
  process.exit(1);
}

if (!process.env.dialogflow) {
  console.log('Error: Specify dialogflow in environment');
  process.exit(1);
}

const Botkit = require('botkit');

const slackController = Botkit.slackbot({
  debug: true,
});

const slackBot = slackController.spawn({
  token: process.env.slack,
});

const dialogflowMiddleware = require('../')({
  keyFilename: process.env.dialogflow,
});

slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();

/* note this uses example middlewares defined above */
slackController.hears(['hello-intent'], 'direct_message', dialogflowMiddleware.hears, function(
  bot,
  message
) {
  bot.reply(message, 'Hello!');
});
