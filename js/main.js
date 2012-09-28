$(function () {
  var RT24 = {
    urlCheckAvailable: "http://rt24-labs.sh.intel.com/appinfo?category="
  };
  var loadApps = function(category) {
    // Load categories.
    $.ajax({
        url: RT24.urlCheckAvailable+category,
        dataType: 'json',
        success: function(apps) {
          var appGrid = $('ul.thumbnails');
          appGrid.fadeOut(100);
          appGrid.children().remove();
          if (apps.length > 0) {
            // Render the appTemplate with the "apps" data
            $("#appTemplate").tmpl(apps).appendTo(appGrid)
            .mouseenter(function() {
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
          }
          appGrid.fadeIn(1000);
        },
        error: function() { console.log('Get categories failed'); }
    });
  };
  
  var loadCategories = function() {
    // Load categories.
    $.ajax({
        url: 'extra/categories.json',
        dataType: 'json',
        success: function(categories) {
          if (categories.length > 0) {
            //console.log(categories);
            var list = $('.well > .nav');
            for (var i in categories) {
              var item = $('<a>').appendTo($('<li>').appendTo(list))
                .attr('category', categories[i].data)
                .attr('href', '#')
                .html(categories[i].name);
              
              /*item.click(function(){
                if (!$(this).parent().hasClass("active")) {
                  $(this).parent().parent().children().removeClass("active");
                  $(this).parent().addClass("active");
                  onNavItemClick($(this).attr('category'));
                }
              });*/
            }
            
            $("ul.nav > li > a").click(function(){
              if (!$(this).parent().hasClass("active")) {
                $(this).parent().parent().children().removeClass("active");
                $(this).parent().addClass("active");
                loadApps($(this).attr('category'));
              }
            });
          }
        },
        error: function() { console.log('Get categories failed'); }
    });
  }


  loadCategories();
  loadApps('new');

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