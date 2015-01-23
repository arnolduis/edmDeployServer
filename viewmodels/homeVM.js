$(document).ready(function() {

    function homeVM() { 

        var commandsData = ko.observable(%commands%);
        var commands = Object.keys(commandsData());
        var editor = ace.edit("editor");
        var output = ko.observable("");
        var outputData  = ko.observable({});
        var outputServers = ko.observableArray([]);
        var selectedCommand = ko.observable(commands[0]);
        var selCmdData = ko.computed(function  () {
            return commandsData()[selectedCommand()];
        });
        var selectedOutput = ko.observable("full");
        var serversData = ko.observable(%servers%);
        var servers = Object.keys(serversData()); // name text of available servers
        var selectedServers = ko.observableArray([servers[0]]);

        // Data preparation
        outputServers(["full"].concat(servers));
        selCmdData.subscribe(function () {
            if (selCmdData().file) {
                getFile(selCmdData().file);
                // console.log(filebuff);
                // editor.setValue(filebuff);
            }
        });
        
        console.log(commandsData());

        function generateFull() {
            var buff = "";
            for (var i in outputData()) {
                if (i != "full") {
                    buff = buff + " ========== " + i + " ========== \n"+ outputData()[i] + "\n";
                }
            }
            return buff;
        }

        // Ace editor     
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/sh");
        editor.$blockScrolling = Infinity;


        // Socket io
        var socket = io.connect("http://localhost");
        socket.on("connect", function () {
            console.log("Socket.io connected!");
        });

        socket.on("stdout", function (data){
            console.log(data);
            var buff = outputData();
            buff[data.name] = buff[data.name] ? buff[data.name] : "";
            buff[data.name] = buff[data.name] + data.output;
            buff.full = generateFull();
            outputData(buff);
            output(outputData()[selectedOutput()]);
            $('#outputTextArea').scrollTop($('#outputTextArea')[0].scrollHeight);
        });

        function showTab (tab) {
            selectedOutput(tab);
            output(outputData()[selectedOutput()]);

        }  

        function getFile (file) {
            $.ajax({
                url: 'commands/getFile',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ file: file })
            })
            .done(function(res) {
                // console.log(res);
                editor.setValue(res.file);
                // return res.file;
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
            });
        }


        function applyCommand () {
            saveAndApply(
                selectedServers(),
                selectedCommand(),
                selCmdData(),
                editor.getValue()
            );
        }

        function deploy () {
            $.ajax({
                url: 'commands/saveAndApply',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    server: 'Test',
                    command: 'runTest',
                    commandData:  commandsData().runTest,
                    file:  null
                })
            })
            .done(function(res) {
                if (res.code !== 0) return false;

                var servers = ['Ireland', 'Sydney', 'Virginia'];
                for (var i = 0; i < servers.length; i++) {
                    $.ajax({
                        url: 'commands/saveAndApply',
                        type: 'POST',
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify({
                            server: servers[i],
                            command: 'runCns',
                            commandData:  commandsData().runCns,
                            file:  null
                        })
                    })
                    .done(function(res) {
                        if (res.code !== 0) return false;
                    })
                    .fail(function(err) {
                        console.log("error");
                        console.log(err);
                        return false;
                    });
                }
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
                return false;
            });
            return true;
        }
        /**
        * Goes through a series of servers and execites commmand
        */
        function saveAndApply (servers, command, commandData, file, callback) {

            for (var i = 0; i < servers.length; i++) {
                $.ajax({
                    url: 'commands/saveAndApply',
                    type: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({
                        server: servers[i],
                        command: command,
                        commandData: commandData || null,
                        file: file || null
                    })
                })
                .done(function(res) {
                    if (res.code !== 0) return false;
                })
                .fail(function(err) {
                    console.log("error");
                    console.log(err);
                    return false;
                });
            }
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
            commandsData: commandsData,
            servers: servers,
            serversData: serversData,
            selectedServers: selectedServers,
            selectedCommand: selectedCommand,
            selCmdData: selCmdData,
            selectedOutput: selectedOutput,
            outputData: outputData,
            outputServers: outputServers,
            output: output,
            // methods
            saveAndApply: saveAndApply,
            applyCommand: applyCommand,
            deploy: deploy,
            showTab: showTab
        };
    }

    ko.applyBindings(homeVM());

});