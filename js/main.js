$(function () {
  var Rt24 = {
    serverUrl: "http://wrt-server.sh.intel.com",
    urlCheckAvailable: "http://wrt-server.sh.intel.com/appinfo?category=",
    appSearchUrl: "http://wrt-server.sh.intel.com/appinfo?search=",
    mode: "available",
    Mode: {
      available: "available",
      installed: "installed",
      updates: "updates"
    },
    Css: {
      install: 'btn-success',
      update: 'btn-warning',
      disable: 'disabled',
      default_icon: 'default_icon.png',
      default_image: 'default.png'
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
    if ($(this).hasClass(Rt24.Css.disable))
      return;
    var name = $(this).parent().prev().prev().find('.rt24-app-name').children().eq(0).html();
    var appid = $(this).parent().parent().parent().attr('appid');
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
      
      if (data[i].icon == null)
        instance = instance.replace('${app_id}/${icon}', Rt24.Css.default_icon);
      
      if (!data[i].has_image)
        instance = instance.replace('${app_id}.png', Rt24.Css.default_image);
      
      for (key in data[i]) {
        var re = new RegExp('\\${'+key+'}', 'g');
        instance = instance.replace(re, data[i][key]);
      }
      instance = instance.replace(new RegExp('\\${server_url}', 'g'), Rt24.serverUrl);
      instance = instance.replace(new RegExp('\\${btn_css}', 'g'), Rt24.Css.install);
      var item = $(instance).appendTo(target);
    }
    return target.children();
  };
  
  var showUpdateBtn = function(apps) {
    for(var i in apps){
      $('ul.thumbnails > li[appid='+apps[i].id+']').find('.btn-mini')
      .removeClass(Rt24.Css.install)
      .removeClass(Rt24.Css.disable)
      .addClass(Rt24.Css.update)
      .text('UPDATE');
    }
  };
  
  var loadApps = function(category, title, search) {
    // Load apps.
    $.ajax({
      url: (search ? Rt24.appSearchUrl : Rt24.urlCheckAvailable) + category,
      dataType: 'json',
      success: function(apps) {
        var appGrid = $('ul.thumbnails');
        appGrid.css('display','none'); //.fadeOut(100);
        appGrid.children().remove();
        if (!apps)
          return;
        
        // Render the appTemplate with the "apps" data
        renderTemplate('appTemplate', apps, appGrid).mouseenter(onMouseEnterTile);
        
        // Bind click event of install button.
        $('.rt24-btn-add > button.btn-mini').click(onBtnInstallClick);
        
        var appStr = apps.length > 1 ? ' Applications' : ' Application';
        var header = $('<h2>'+title+' <small>'+apps.length+appStr+'</small></h2>');
        $('div.page-header').children().replaceWith(header);
        
        if (chrome && chrome.management) {
          chrome.management.getAll(function(apps) {
            for (var i in apps) {
              var btn = $('ul.thumbnails > li[appid='+apps[i].id+']').find('.btn-mini');
              if (!btn.hasClass(Rt24.Css.update))
                btn.removeClass(Rt24.Css.install).addClass(Rt24.Css.disable).text('INSTALLED');
            };
          });
        }
        
        showUpdateBtn(Rt24.updateList);
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
              loadApps($(this).attr('category'), $(this).text(), false);
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
    
    if (Rt24.mode == Rt24.Mode.available) {
      showUpdateBtn(apps);
    } else if (Rt24.mode == Rt24.Mode.updates) {
      var appGrid = $('ul.thumbnails');
      appGrid.css('display','none');//.fadeOut(100);
      appGrid.children().remove();
      
      var appItems = new Array();
      var count = 0;
      for(var i in apps){
        chrome.management.get(apps[i].id, function(app){
          var appItem = {
            app_id: app.id,
            app_name: app.name,
            version: apps[i].version,
            description: app.description,
            server_url: Rt24.serverUrl
          }
          appItems.push(appItem);
          if (++count == apps.length) {
            renderTemplate('updateTmpl', appItems, appGrid).mouseenter(onMouseEnterTile);
            appGrid.fadeIn();
          }
        });
      }
      // Head text
      var appStr = apps.length > 1 ? ' Applications' : ' Application';
      var header = $('<h2>Updates<small>'+apps.length+appStr+'</small></h2>');
      $('div.page-header').children().replaceWith(header);
      
      // App images.
      for(var i in apps){
        {
          var id = apps[i].id;
          var imageUrl = Rt24.serverUrl + '/bin/images/' + id + '.png';
          $.ajax({
            url: imageUrl,
            success: function() {
              $('ul.thumbnails > li[appid='+id+']').find('.rt24-thumb').find('img').attr('src', imageUrl);
            },
            error: function() {console.log('Get app failed');}
          });
        }
      }
    }
    Rt24.updateList = apps;
  };
  
  var searchApp = function(keyword) {
    // Clear search result when keyword is empty.
    if (keyword == '') {
      if (Rt24.mode == Rt24.Mode.available) {
        var item = $('ul.rt24-nav > li.active').children();
        var category = item.attr('category');
        var title = item.html();
        loadApps(category, title, false);
      } else if (Rt24.mode == Rt24.Mode.updates) {
        loadUpdates();
      }
    } else
      loadApps(keyword, 'Search Result', true);
  };
  
  // Bind search event
  $('input.search-query').keydown(function(event){
    if(event.keyCode == 13){
      searchApp($(this).val());
    }
  });
  
  $('.rt24-mode').click(function(){
    if ($(this).parent().hasClass('active'))
      return;
    
    $(this).parent().parent().children().removeClass("active");
    $(this).parent().addClass("active");
    var index = $(this).parent().index();
    if (index == 0) {
      Rt24.mode = Rt24.Mode.available;
      
      var item = $('ul.rt24-nav > li.active').children();
      var category = item.attr('category');
      var title = item.html();
      loadApps(category, title, false);
    } else if (index == 1) {
      Rt24.mode = Rt24.Mode.updates;
      loadUpdates();
    }
  });
  
  // Bind chrome events.
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.name == "update_notifiy") {
      // Refresh app list;
      onUpdatesNotified(request.updates);
    }
  });
  
  chrome.management.onInstalled.addListener(function(info) {
    if (!info.isApp)
      return;
    
    $('ul.thumbnails > li[appid='+info.id+']').find('.btn-mini')
      .removeClass(Rt24.Css.install)
      .removeClass(Rt24.Css.update)
      .addClass(Rt24.Css.disable)
      .text('INSTALLED');
  });
  
  chrome.management.onUninstalled.addListener(function(id) {
    $('ul.thumbnails > li[appid='+id+']').find('.btn-mini')
      .removeClass(Rt24.Css.disable)
      .removeClass(Rt24.Css.update)
      .addClass(Rt24.Css.install)
      .text('INSTALL');
  });
  
  loadCategories();
  loadApps('new', 'New', false);
  loadUpdates();
});