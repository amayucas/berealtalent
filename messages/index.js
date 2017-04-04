"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});
//Labels que vamos a usar
var DialogLabels = {
    Si: 'Si',
    No: 'No',
    Test: 'Test de Preguntas',
    Salir: 'Salir'
}; 
var bot = new builder.UniversalBot(connector);

bot.dialog('/', [function (session) {
    builder.Prompts.text(session,'Hola,¿Como te llamas?.');
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.choice(session, 'Hola ' +session.userData.name+ ', Selecciona una opción: ',[DialogLabels.Test, DialogLabels.Salir],
            {
                maxRetries: 3,
                retryPrompt: 'No es una opcion valida.'
            });
    },
    function (session, results) {
        if (!results.response) {
            // exhausted attemps and no selection, start over
            session.send('¡Lo siento! Intentos posibles superados.');
            return session.endDialog();
        }
        var test=results.response.entity;
        switch(test){
            case DialogLabels.Test:
                return session.beginDialog('/questions');
            case DialogLabels.Salir:
                return session.endDialog();
        }
    },
    //Aquí ponemos preguntas si dice que si
    function (session, results) {
        var op=results.response.entity;
        switch (op) {
            case DialogLabels.Si:
                 return session.beginDialog('/questions2');
            case DialogLabels.No:
                return session.endDialog();
        }
    }, 
    //Cada pregunta la guardo en un dialogo
    function (session, results) {
        session.userData.age=results.response;
        return session.beginDialog('/questions3');
    },
    //Los datos los tengo guardados para usos posteriores
    function (session, results) {
        var follow=results.response.entity;
        builder.Prompts.text(session,'Vale ' +session.userData.name+'.');
        session.endDialog('Gracias por contestar a mis preguntas.Nos vemos.');
    }
]);
bot.dialog('/questions',function (session) {
        builder.Prompts.choice(session,"¿Puedo hacerte algunas preguntas?(Si/No).",
            [DialogLabels.Si,DialogLabels.No]);
    
});
bot.dialog('/questions2',function (session) {
        builder.Prompts.number(session,'¿Cuantos años tienes?');
});
bot.dialog('/questions3',function (session) {
        builder.Prompts.choice(session,'¿Como me has encontrado?',['Casualidad','Internet','Amigos','Otros']);
});
bot.use({
    botbuilder: function (session, next) {
        if (/^log on/i.test(session.message.text)) {
            session.userData.isLogging = true;
            session.send('Logging is now turned on');
        } else if (/^log off/i.test(session.message.text)) {
            session.userData.isLogging = false;
            session.send('Logging is now turned off');
        } else {
            if (session.userData.isLogging) {
                console.log('Message Received: ', session.message.text);
            }
            next();
        }
    }
});
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
    
} else {
    module.exports = { default: connector.listen() }
} 
