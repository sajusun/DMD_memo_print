var netArray = []
var totalArray = []

function bn2en(data) {
    var englishDigits = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9'
    };
    /* Converting Devanagari number to English (js) */
    var amount_en = data.replace(/[০১২৩৪৫৬৭৮৯]/g, function(s) {
        return englishDigits[s];
    });

    // console.log(amount_en); // Output 9857  
    // $("#output").html(amount_en*2);
    return parseInt(amount_en);
}

function en2bn(data) {
    var banglaDigits = {
        '0': '০',
        '1': '১',
        '2': '২',
        '3': '৩',
        '4': '৪',
        '5': '৫',
        '6': '৬',
        '7': '৭',
        '8': '৮',
        '9': '৯'
    };
    /* Converting English number to Devangari (js) */
    var amount_bn = data.toString().replace(/[0123456789]/g, function(s) {
        return banglaDigits[s];
    });
    // console.log(amount_bn); // Output: ९८५७  
    // $("#output").html(amount_bn);
    return amount_bn;
}

function udata() {
    var amount = $("#namedata").text();
    var mydata = bn2en(amount);
    $("#output").html(mydata);
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function(event) {

    // Put the button into a variable
    var e = document.getElementById("print");

    // Wait for user to click the button
    e.addEventListener("click", function() {
        window.print();
    }, false);

});

function calculation(id) {
    var result = $("#" + id + "total");
    //result.html(id);
    // $("#" + id + "net").on("keyup", function() {
    //     alert("id");
    // });
}

function result(id) {
    var netB = $("#" + id + "net").text();
    var net = bn2en(netB);

    var net1B = $("#1net").text();
    var net1 = bn2en(net1B);
    var net2B = $("#2net").text();
    var net2 = bn2en(net2B);
    var net3B = $("#3net").text();
    var net3 = bn2en(net3B);
    var net4B = $("#4net").text();
    var net4 = bn2en(net4B);
    var net5B = $("#5net").text();
    var net5 = bn2en(net5B);
    var net6B = $("#6net").text();
    var net6 = bn2en(net6B);
    var net7B = $("#7net").text();
    var net7 = bn2en(net7B);
    var net8B = $("#8net").text();
    var net8 = bn2en(net8B);
    var net9B = $("#9net").text();
    var net9 = bn2en(net9B);
    var net10B = $("#10net").text();
    var net10 = bn2en(net10B);
    netArray = [net1, net2, net3, net4, net5, net6, net7, net8, net9, net10]
    var netArray = netArray.filter(Number)
    var totalnetvalue = 0;
    for (let index = 0; index < netArray.length; index++) {
        totalnetvalue = totalnetvalue + netArray[index]
    }

    // totalnetvalue = (+net1) + (+net2) + (+net3) + (+net4) + (+net5) + (+net6) + (+net7) + (+net8) + (+net9) + (+net10);

    var priceB = $("#" + id + "price").text();
    var price = bn2en(priceB);
    var result = $("#" + id + "total");

    var amountsign = $("#" + id + "amunt-sign");
    var totalamountsign = $("#total-amunt-sign");


    var totalamunt = $("#total-amunt");
    var amountbox = $("#11net");
    var advance = $("#total-avdance");
    var advancevalueB = $("#total-advance").text();
    var advancevalue = bn2en(advancevalueB);
    var due = $("#total-due");
    var totalamuntvalue = (net * price);
    totalamuntvalueB = en2bn(totalamuntvalue);

    if (totalamuntvalue >= 0) {
        result.text(totalamuntvalueB);
        amountsign.text("/-");
    } else {
        amountsign.text("");
        result.text("");
    }
    var value1B = $("#1total").text();
    var value1 = bn2en(value1B);
    var value2B = $("#2total").text();
    var value2 = bn2en(value2B);
    var value3B = $("#3total").text();
    var value3 = bn2en(value3B);
    var value4B = $("#4total").text();
    var value4 = bn2en(value4B);
    var value5B = $("#5total").text();
    var value5 = bn2en(value5B);
    var value6B = $("#6total").text();
    var value6 = bn2en(value6B);
    var value7B = $("#7total").text();
    var value7 = bn2en(value7B);
    var value8B = $("#8total").text();
    var value8 = bn2en(value8B);
    var value9B = $("#9total").text();
    var value9 = bn2en(value9B);
    var value10B = $("#10total").text();
    var value10 = bn2en(value10B);

    totalArray = [value1, value2, value3, value4, value5, value6, value7, value8, value9, value10]
    totalArray = totalArray.filter(Number)
    var totalvalue = 0;
    for (let index = 0; index < totalArray.length; index++) {
        totalvalue = totalvalue + totalArray[index];
    }

    // totalvalue = (+value1) + (+value2) + (+value3) + (+value4) + (+value5) + (+value6) + (+value7) + (+value8) + (+value9) + (+value10);

    amountbox.html(en2bn(totalnetvalue));
    var totalvalueB = en2bn(totalvalue);
    if (totalvalue != 0) {
        totalamunt.text(totalvalueB);
        totalamountsign.text("/-");
        document.getElementById('amunt-in-details').innerHTML = inWordbn(totalvalue) + " টাকা মাত্র";
    } else {
        totalamunt.text("");
        totalamountsign.text("");
        document.getElementById('amunt-in-details').innerHTML = "";
    }

    dateDisplay();
    if (advancevalue != 0) {
        payment();
    }

}

function payment() {

    var totalamuntB = $("#total-amunt").text();
    var totalamunt = bn2en(totalamuntB);
    var advancevalueB = $("#total-advance").text();
    var duesign = $("#due-amunt-sign");
    var advancevalue = bn2en(advancevalueB);
    var ad_val_sign = $("#advance-value-sign");

    var due = $("#total-due");
    if (advancevalue >= 0) {
        var duevalueE = (totalamunt) - (advancevalue);
        var duevalueB = en2bn(duevalueE)
        due.text(duevalueB);
        duesign.text("/-");
        ad_val_sign.text("/-");
    } else {
        due.text(" ");
        duesign.text(" ");
        ad_val_sign.text("");
    }

}