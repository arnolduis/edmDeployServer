$(document).ready(function() {

    function homeVM() { 

        var commands = ko.observable(%commands% );
        var deployIsAvailable = ko.observable(true);
        var editor = ace.edit("editor");
        var isSaveAndApplyAvailable = ko.observable(true);
        var output = ko.observable("");
        var outputData  = ko.observable({});
        var outputServers = ['full'];
        var selectedCommand = ko.observable(commands[0]);
        var selectedOutput = ko.observable("full");
        var servers = ko.observable(%servers%);
        var selectedServers = ko.observableArray([servers()[0]]);

        // Data preparation
        selectedServers.subscribe(function () {
            console.log(selectedServers());
        });
        selectedCommand.subscribe(function () {
            if (selectedCommand().file) {
                getFile(selectedCommand().file);
            }
        });
        for (var i = 0; i < servers().length; i++) {
            outputServers.push(servers()[i].name);
        }

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
            // console.log(data);
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
                editor.setValue(res.file);
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
            });
        }

        /**
        *  
        */
        function applyCommand () {
            if (selectedServers().length<1) return console.log("No servers were seleced");
            isSaveAndApplyAvailable(false);
            $.ajax({
                url: 'commands/saveAndApply',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    servers: selectedServers(),
                    command: selectedCommand(),
                    file: editor.getValue() || null
                })
            })
            .done(function(res) {
                // console.log(res);
                isSaveAndApplyAvailable(true);
                if (res.code !== 0) return false;
                return true;
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
                return false;
            });
        }

        function applyTestCommand () {
            deployIsAvailable(false);
            console.log('applytext');
            $.ajax({
                url: 'commands/testCommand',
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    "command": "testAndDeploy" //ttt 
                })
            })
            .done(function(res) {
                console.log(res);
                deployIsAvailable(true);
            })
            .fail(function(err) {
                console.log("error");
                console.log(err);
                return false;
            });

        }

        return {
            commands: commands,
            servers: servers,
            selectedServers: selectedServers,
            selectedCommand: selectedCommand,
            selectedOutput: selectedOutput,
            outputData: outputData,
            outputServers: outputServers,
            output: output,
            deployIsAvailable: deployIsAvailable,
            isSaveAndApplyAvailable: isSaveAndApplyAvailable,
            // methods
            // saveAndApply: saveAndApply,
            applyCommand: applyCommand,
            applyTestCommand: applyTestCommand,
            showTab: showTab
        };
    }

    ko.applyBindings(homeVM());

});