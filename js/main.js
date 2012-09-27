$(function () {

  var loadCategories = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "extra/categories.json", true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (xhr.responseText == null)
          return;
        
        var categories = JSON.parse(xhr.responseText);
                
        if (categories.length > 0) {
          //console.log(categories);
          for (var i in categories) {
            
          }
        }
      }
    }
    xhr.onerror = function() {console.log("Get available apps failed.");}
    xhr.send();
    
    setTimeout(function(){ xhr.abort(); }, 5000);
  }


  loadCategories();

  $("ul.nav > li > a").click(function(){
    $(this).parent().parent().children().removeClass("active");
    $(this).parent().addClass("active");
  });
  
  $(".row-fluid .rt24-span").mouseenter(function() {
    var sender = $(this);
    var timeout = setTimeout(function() {
      var left = $(this).width() + 6;
      sender.find(".rt24-thumb").animate({left: left+'px'}, 150);
    }, 300);
    
    var onmouseleave = function(){
      sender.find(".rt24-thumb").animate({left: 0}, 150);
      clearTimeout(timeout);
      $(".row-fluid .rt24-span").unbind('mouseleave', onmouseleave);
    }
    
    $(".row-fluid .rt24-span").bind('mouseleave', onmouseleave);
  });
  
  $(".row-fluid .rt24-span").mouseleave(function() {
  });
});