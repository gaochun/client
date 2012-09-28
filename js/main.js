$(function () {
  var Rt24 = {
    serverUrl: "http://wrt-server.sh.intel.com",
    urlCheckAvailable: "http://wrt-server.sh.intel.com/appinfo?category=",
    mode: "available",
    Mode: {
      available: "available",
      installed: "installed",
      updates: "updates"
    }
  };
  
  var onMouseEnterTile = function() {
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
  };
  
  var onBtnInstallClick = function() {
    var name = $(this).parent().prev().prev().find('.rt24-app-name').children().eq(0).html();
    var appid = $(this).attr('appid');
    var url = Rt24.serverUrl + '/bin/' + appid + '/' + appid + '.crx';
    document.getElementById('plugin').install(url, name, function(result) {
      if (!result) {
        /*var installBtn = $('div.btn-install[appid='+btnInstall.attr('appid')+']').show();
        installBtn.next().hide();
        installBtn.next().next().hide();*/
      }
    })
    //$(this).hide();
    //$(this).next().next().show();
  };
  
  var renderTemplate = function(tmplId, data, target) {
    var tmpl = $('#'+tmplId).html();
    for (i in data) {
      var instance = tmpl;
      for (key in data[i]) {
        var re = new RegExp('\\${'+key+'}', 'g');
        instance = instance.replace(re, data[i][key]);
      }
      instance = instance.replace(new RegExp('\\${server_url}', 'g'), Rt24.serverUrl);
      $(instance).appendTo(target);
    }
    return target.children();
  };
  
  var loadApps = function(category, title) {
    // Load apps.
    $.ajax({
        url: Rt24.urlCheckAvailable+category,
        dataType: 'json',
        success: function(apps) {
          var appGrid = $('ul.thumbnails');
          appGrid.fadeOut(100);
          appGrid.children().remove();
          if (apps.length > 0) {
            // Render the appTemplate with the "apps" data
            renderTemplate('appTemplate', apps, appGrid).mouseenter(onMouseEnterTile);
          }
          
          // Bind click event of install button.
          $('.rt24-btn-add > button.btn-mini').click(onBtnInstallClick);
    
          var header = $('<h2>'+title+' <small>'+apps.length+' Applications</small></h2>');
          $('div.page-header').children().replaceWith(header);
          appGrid.fadeIn(1000);
        },
        error: function() { console.log('Get app failed'); }
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
            }
            
            // Bind click event of nav list item.
            $("ul.rt24-nav > li > a").click(function(){
              if (!$(this).parent().hasClass("active")) {
                $(this).parent().parent().children().removeClass("active");
                $(this).parent().addClass("active");
                loadApps($(this).attr('category'), $(this).text());
              }
            });
          }
        },
        error: function() { console.log('Get categories failed'); }
    });
  }
  
  var loadUpdates = function() {
    // Let background.js to check update
    chrome.extension.sendMessage({name: 'check_update'});
  };

  var onUpdatesNotified = function(apps) {
    var count = apps.length;
    $('div.navbar-fixed-top').find('ul.nav').children().eq(1).children().html('Updates('+count+')');
  };
  
  // Bind chrome events.
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.name == "update_notifiy") {
      // Refresh app list;
      onUpdatesNotified(request.updates);
    }
  });
  
  $('.rt24-mode').click(function(){
    if ($(this).parent().hasClass('active'))
      return;
    
    $(this).parent().parent().children().removeClass("active");
    $(this).parent().addClass("active");
    if ($(this).parent().index() == 0) {
      var item = $('ul.rt24-nav > li.active').children();
      var category = item.attr('category');
      var title = item.html();
      loadApps(category, title);
    }
  });
  
  
  loadCategories();
  loadApps('new', 'New');
  loadUpdates();
});