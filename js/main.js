$(function () {
  $("ul.nav > li > a").click(function(){
    $(this).parent().parent().children().removeClass("active");
    $(this).parent().addClass("active");
  });
});