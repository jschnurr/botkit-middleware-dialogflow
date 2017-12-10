/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Facebook bot built with Botkit, using the Dialogflow middleware.

This bot demonstrates many of the core features of Botkit:

* Connect to Facebook's Messenger APIs
* Receive messages based on "spoken" patterns
* Reply to messages

# RUN THE BOT:

  Follow the instructions here to set up your Facebook app and page:

    -> https://developers.facebook.com/docs/messenger-platform/implementation

  Run your bot from the command line:

    app_secret=<MY APP SECRET> \
    page_token=<MY PAGE TOKEN> \
    verify_token=<MY_VERIFY_TOKEN> \
    dialogflow=<CLIENT_ACCESS_TOKEN> \
    node facebook_bot.js [--lt [--ltsubdomain LOCALTUNNEL_SUBDOMAIN]]

  Use the --lt option to make your bot available on the web through localtunnel.me.

# USE THE BOT:

  Train an intent titled "hello-intent" inside Dialogflow.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.

  Find your bot inside Facebook to send it a direct message.

  Say: "Hello"

  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the dialogflow console!

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

if (!process.env.app_secret) {
    console.log('Error: Specify app_secret in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var os = require('os');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');

const ops = commandLineArgs([
    {
        name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
        type: Boolean, defaultValue: false,
    },
    {
        name: 'ltsubdomain', alias: 's', args: 1,
        description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
        type: String, defaultValue: null,
    },
]);

if (ops.lt === false && ops.ltsubdomain !== null) {
    console.log('error: --ltsubdomain can only be used together with --lt.');
    process.exit();
}

var controller = Botkit.facebookbot({
    debug: true,
    log: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
    app_secret: process.env.app_secret,
    validate_requests: true, // Refuse any requests that don't provide the app_secret specified
});

var dialogflow = require('../')({
    token: process.env.dialogflow,
});

controller.middleware.receive.use(dialogflow.receive);

var bot = controller.spawn({
});

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if (ops.lt) {
            var tunnel = localtunnel(process.env.port || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log(
                    'Your bot is available on the web at the following URL: ' + tunnel.url + '/facebook/receive'
                );
            });

            tunnel.on('close', function() {
                console.log('Your bot is no longer available on the web at the localtunnnel.me URL.');
                process.exit();
            });
        }
    });
});


controller.api.messenger_profile.greeting('Hello! I\'m a Botkit bot!');
controller.api.messenger_profile.menu([{
    'locale': 'default',
    'composer_input_disabled': false,
}]);

/* note this uses example middleware defined above */
controller.hears(['hello-intent'], 'message_received,facebook_postback', dialogflow.hears, function(bot, message) {
    bot.reply(message, 'Hello!');
});
