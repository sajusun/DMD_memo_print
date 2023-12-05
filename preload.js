const { ipcRenderer } = require("electron");

// after dom content loaded.....
window.addEventListener("DOMContentLoaded", () => {
    appSettingsInit()
    mainContentLoader();
});

function appAlert(text = "Welcome..", textColor = "green") {
    var box = $("#alert");
    box[0].style.visibility = "visible";
    var p = box[0].children[0].children[0];
    p.innerText = text;
    p.style.color = textColor;
    setTimeout(() => {
        box[0].style.visibility = "hidden";
    }, 2000);
}

function mainContentLoader() {
    // home page load into mainBody div
    $("#mainBody").load("../DMD/pages/homePage.html", () => {

        //open memo page in new window
        document.querySelector("#createMemo").onclick = function() {
            //window.open('./memo/index.html')
            ipcRenderer.send('openMemo', 'memo');
        };
        // memo page view function
        document.querySelector("#viewMemo").onclick = function() {
            $("#mainBody").load("../DMD/pages/viewMemoData.html");
        };
        //login page view function
        document.querySelector("#loginPanel").onclick = function() {
            $("#mainBody").load("../DMD/pages/userLogin.html", () => {
                var loginBtn = document.querySelector("#loginBtn");
                if (sessionStorage.loginFlag) {
                    $("#mainBody").load("./pages/adminPanel.html", () => {
                        adminPannel();
                    });
                }
                loginBtn.onclick = () => {
                    loginData();
                };
                $("input").on("click", function(e) {
                    this.onkeypress = function(e) {
                        if (e.keyCode == "13") {
                            loginData();
                        }
                    };
                });
            });
        };
    });
}

////////////////////login pannel funtions
function loginData() {
    var user = $("#userName").val();
    var pass = $("#userPass").val();
    var defaultUser = "admin";
    var defaultPass = "admin";
    if (defaultUser != user || defaultPass != pass) {
        appAlert("Access Failed!", "red");
    } else {
        sessionStorage.loginFlag = true;
        $("#mainBody").load("./pages/adminPanel.html", () => {
            adminPannel();
        });
    }
}
// admin pannel page funtions
function adminPannel() {
    appSettings()
    var logoutBtn = document.querySelector("#logOut");
    logoutBtn.onclick = function() {
        sessionStorage.loginFlag = "";
        //appAlert("leave Success")
        mainContentLoader();
    };
}

function appSettings() {

    var appBgC = $('#appBgC')[0];
    var appTitleC = $('#appTitleC')[0];
    var appMABGC = $('#appMABGC')[0];
    var appFooterC = $('#appFooterC')[0];

    function colorSet() {
        appBgC.children[1].value = localStorage.appBgC;
        appTitleC.children[1].value = localStorage.appTitleC;
        appMABGC.children[1].value = localStorage.appMABGC;
        appFooterC.children[1].value = localStorage.appFooterC;
    }
    appBgC.children[2].onclick = function() {
        localStorage.appBgC = appBgC.children[1].value;
        appAlert("Success! Reload The App")
    }
    appTitleC.children[2].onclick = function() {
        localStorage.appTitleC = appTitleC.children[1].value;
    }
    appMABGC.children[2].onclick = function() {
        localStorage.appMABGC = appMABGC.children[1].value;
    }
    appFooterC.children[2].onclick = function() {
        localStorage.appFooterC = appFooterC.children[1].value;
    }
    colorSet()
}

function appSettingsInit() {
    if (localStorage.appBgC) {
        $('html')[0].style.backgroundColor = localStorage.appBgC;
    }

}