function dateDisplay() {
    var d = new Date();
    var iddate = $("#date");
    var idmonth = $("#month");
    var idyear = $("#year");
    var date = d.getDate();
    var dateB = en2bn(date);
    var year = d.getFullYear();
    var yearB = en2bn(year);
    var month = d.getMonth();
    var monthB = en2bn(+month + 1);
    iddate.html(dateB);
    idmonth.html(monthB);
    idyear.html(yearB);
}