$(document).ready(function() {

    function homeVM() { 

        // Ace editor     
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/sh");
        editor.$blockScrolling = Infinity;



        var serversRaw = %servers%;
        var commandsRaw = %commands%;
        var servers = toObsArray(%servers%);
        var commands = toObsArray(%commands%);

        var command = ko.observable();

        




        var outputData  = ko.observable({});
        var outputServers = ko.observableArray([]);
        outputServers.push({name: 'full'});
        for(var i in servers()) {
            outputServers.push({name: servers()[i].name});
        }

        var output = ko.observable("");
        var selectedOutput = ko.observable("full");



        var socket = io.connect("http://localhost");
        socket.on("connect", function () {
            console.log("Socket.io connected!");
        });
        socket.on("stdout", function (data){
            var buff = outputData();
            buff[data.name] = buff[data.name] ? buff[data.name] : "";
            buff[data.name] = buff[data.name] + data.output;
            buff.full = generateFull();
            outputData(buff);
            output(outputData()[selectedOutput()]);
            $('#outputTextArea').scrollTop($('#outputTextArea')[0].scrollHeight);
        });

        function generateFull () {
            var buff = "";
            for (var i in outputData()) {
                if (i != "full") {
                    buff = buff + " ========== " + i + " ========== \n"+ outputData()[i] + "\n";
                }
            }
            return buff;
        }


        function showTab () {
            selectedOutput(this.name);
            output(outputData()[selectedOutput()]);
        }  













        var selectedServers = ko.observableArray([servers()[0]]);
        var selectedCommand = ko.observable(commands()[0]);

        var file = ko.observable();
        var fileName = ko.observable();


        selectedCommand.subscribe(function () {
            if (selectedCommand().value.file) {
                $.ajax({
                    url: 'commands/getFile',
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({ file: selectedCommand().value.file })
                })
                .done(function(res) {
                    file(res.file);
                    editor.setValue(res.file);
                })
                .fail(function(err) {
                    console.log("error");
                    console.log(err);
                });
            }
        });

        function saveAndApply () {

            for (var i = 0; i < selectedServers().length; i++) {
                $.ajax({
                    url: 'commands/saveAndApply',
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        server: selectedServers()[i],
                        command: selectedCommand(),
                        file: selectedCommand().value.file ? editor.getValue() : null
                    })
                })
                .done(function(res) {
                    // console.log(res); 
                })
                .fail(function(err) {
                    console.log("error");
                    console.log(err);
                    return false;
                });
            }
            return true;
        }

        function applyCommand (server, command) {
            $.ajax({
                url: 'commands/saveAndApply',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    server: { name: 'Test', value: serversRaw.Test },
                    command: { name: 'runTest', value: commandsRaw.runTest },
                    file: null
                })
            })
            .done(function(res) {
                // console.log(res); 
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
                return false;
            });
        }

        function deploy () {
            console.log({ name: 'Test', value: serversRaw.Test });
            console.log({
                    server: { name: 'Test', value: serversRaw.Test },
                    command: { name: 'runTest', value: commandsRaw.runTest },
                    file: null
                });

            $.ajax({
                url: 'commands/saveAndApply',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    server: { name: 'Test', value: serversRaw.Test },
                    command: { name: 'runTest', value: commandsRaw.runTest },
                    file: null
                })
            })
            .done(function(res) {
                console.log(commandsRaw);
                if (res.code == 0) {
                    console.log(selectedServers());
                    for (var i = 0; i < selectedServers().length; i++) {
                        if (selectedServers()[i].name == "Test") continue;
                        $.ajax({
                            url: 'commands/saveAndApply',
                            type: 'POST',
                            contentType: 'application/json',
                            dataType: 'json',
                            data: JSON.stringify({
                                server: selectedServers()[i],
                                command: {name: 'runCns', value: commandsRaw.runCns},
                                file: selectedCommand().value.file ? editor.getValue() : null
                            })
                        })
                        .done(function(res2) {
                            if(res2.code != 0) return false;
                        })
                        .fail(function(err) {
                            console.log("error");
                            console.log(err);
                            return false;
                        });
                    }
                }
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
                return false;
            });

            return true;
        }










        function toObsArray(obj) {
            var result = [];
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    result.push({name: prop, value: obj[prop]}); 
                }  
            }
            
            return ko.observableArray(result);
        }

        return {
            commands: commands,
            servers: servers,
            selectedServers: selectedServers,
            selectedCommand: selectedCommand,
            selectedOutput: selectedOutput,
            command: command,
            // fullOutput: fullOutput,
            // commandOutputs: commandOutputs,
            output: output,
            outputServers: outputServers,
            file: file,
            fileName: fileName,

            // methods
            saveAndApply: saveAndApply,
            deploy: deploy,
            showTab: showTab
        };
    }

    ko.applyBindings(homeVM());

});