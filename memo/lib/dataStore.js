let fs = require('fs');
var customarData = [];
var ele = [];
var total = ele.total = [];
var date = [];
let elementData = "";
var allData = "";
// erron NaN checking
function nanChecking(data) {
    if (data) {
        return data;
    } else {
        return "";
    }
}
///////////// window DOM Content loaded
window.addEventListener("DOMContentLoaded", function(event) {
    var d = new Date();
    date.d = d.getDate();
    date.y = d.getFullYear();
    date.m = d.getMonth() + 1;
    var cdata = $("#client-info");


    document.querySelector("#printSave").onclick = function() {
        customarData.name = cdata[0].children[0].children[0].textContent;
        customarData.address = cdata[0].children[0].children[1].textContent;
        ///////////////// name and address fill checking
        if (customarData.name != "" & customarData.address != "") {
            getData();
            fileHandling();

        } else {
            appAlert("Fill Name & Address Properly", "red");
        }
    };
});






function getData() {
    ele = [];
    elementData = "";
    var productName = $(".second");
    var quentity = $(".third");
    var pricePer = $(".fourth");
    total.q = bn2en($("#11net")[0].textContent);
    total.p = nanChecking(bn2en($("#total-amunt")[0].textContent));
    total.a = nanChecking(bn2en($("#total-advance")[0].textContent));
    total.d = total.p - total.a;
    var totals = total.q + "," + total.p + "," + total.a + "," + total.d;
    for (let i = 0; i < productName.length - 1; i++) {
        if (i != 0) {
            if (productName[i].textContent != "") {
                ele.push([productName[i].textContent, nanChecking(bn2en(quentity[i].textContent)),
                    nanChecking(bn2en(pricePer[i].textContent)), nanChecking(Number(bn2en(quentity[i].textContent) *
                        bn2en(pricePer[i].textContent)))
                ]);
                elementData += productName[i].textContent + "," +
                    nanChecking(bn2en(quentity[i].textContent)) + "," +
                    nanChecking(bn2en(pricePer[i].textContent)) + "," +
                    nanChecking(Number(bn2en(quentity[i].textContent) *
                        bn2en(pricePer[i].textContent))) + "\n";
            }
        }
    }
    allData = date.d + "-" + date.m + "-" + date.y + "\n" +
        customarData.name + "\n" + customarData.address + "\n" + elementData + totals;

}



//// data files handling
function fileHandling() {
    var filename = customarData.name + "," + date.d + "-" + date.m + "-" + date.y;
    var fileDir = "./dataFiles/client-log/" + filename + ".txt";
    var logFile = "./dataFiles/logFile," + date.m + "-" + date.y + ".txt";
    // var allData = date.d + "-" + date.m + "-" + date.y + "\n" +
    //     customarData.name + "\n" + customarData.address + "\n" + elementData;

    if (fs.existsSync(fileDir)) {

        appAlert("File Already Exist", "red");
        // let data = fs.readFileSync(fileN, 'utf8').split('\n')

        // data.forEach((contact, index) => {
        //     var [name, email] = contact.split('\n')
        //     console.log(index + " :" + contact);
        //     console.log("1st name : " + data[0]);
        //     addEntry(name, email)
        // })

    } else {

        if (fs.existsSync(logFile)) {
            fs.appendFile(logFile, filename + '\n', function(err) {
                if (err) {
                    console.log(err);
                } else {
                    newFileWrite(fileDir, allData);
                }
            });

        } else {
            fs.writeFile(logFile, filename + '\n', function(err) {
                if (err) {
                    console.log(err);
                } else {
                    newFileWrite(fileDir, allData);
                }
            });

        }

    }

    function newFileWrite(file, data) {
        fs.writeFile(file, data, function(err) {
            if (err) {
                console.log(err);
            } else {
                appAlert("Data Saved");
                print();

            }
        });

    }

}