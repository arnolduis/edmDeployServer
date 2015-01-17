$(document).ready(function() {

    function homeVM() { 

        // Ace editor     
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode("ace/mode/sh");
        editor.$blockScrolling = Infinity;



        var servers = toObsArray(%servers%);
        var commands = toObsArray(%commands%);

        var command = ko.observable();

        var output = ko.observable({});
        var fullOutput = ko.computed(function () {
            var buff = "";
            for (var i in output()) {
                buff = buff + " ========== " + i + " ========== \n"+ output()[i] + "\n";
            }
            return  buff;
        }, this);

        var selectedServers = ko.observableArray([servers()[0]]);
        var selectedCommand = ko.observable(commands()[0]);

        var file = ko.observable();
        var fileName = ko.observable();


        selectedCommand.subscribe(function () {
            if (selectedCommand().value.file) {
                console.log('subs: ' + JSON.stringify({ file: selectedCommand().value.file }));
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
                        server: { 
                            name:  selectedServers()[i].text, 
                            value: selectedServers()[i].value }, 
                        command: { 
                            name: selectedCommand().text, 
                            value: selectedCommand().value},
                        file: editor.getValue()
                        })
                })
                .done(function(res) {

                    console.log(res); 
                })
                .fail(function(err) {
                    console.log("error");
                    console.log(err);
                });
            }

        }      






        var socket = io.connect("http://localhost");
        socket.on("connect", function () {
            console.log("Connected!");
        });
        socket.on("stdout", function (data) {
            var buff = output();
            buff[data.name] = buff[data.name] ? buff[data.name]: "";
            buff[data.name] = buff[data.name]  + data.output;
            // buff[data.name] = buff[data.name] + "[" + new Date().format("isoDateTime") + "]\n" + data.output + "\n";
            output(buff);
            $('#outputTextArea').scrollTop($('#outputTextArea')[0].scrollHeight);
            console.log(data);
        });
        socket.emit("message", {data: 'heloka'});

        function toObsArray(obj) {
            var result = [];
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    result.push({text: prop, value: obj[prop]}); 
                }  
            }
            
            return ko.observableArray(result);
        }

        return {
            commands: commands,
            servers: servers,
            selectedServers: selectedServers,
            selectedCommand: selectedCommand,
            command: command,
            fullOutput: fullOutput,
            // commandOutputs: commandOutputs,
            output: output,
            file: file,
            fileName: fileName,

            // methods
            saveAndApply: saveAndApply,
        };
    }

    ko.applyBindings(homeVM());

});