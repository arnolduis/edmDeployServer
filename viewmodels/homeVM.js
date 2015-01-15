$(document).ready(function() {

    function homeVM() {      

        var servers = toObsArray(%servers%);
        var commands = toObsArray(%commands%);

        var command = ko.observable();
        // var commandOutputs = ko.observableArray();
        var output = ko.observable("");

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
                            value: selectedCommand().value}
                        })
                })
                .done(function(res) {
                    console.log(res);
                    output(output() + "======= " + res.name + " =======\n" + res.output + "\n");
                    console.log(output());
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
        socket.on("news", function (data) {
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