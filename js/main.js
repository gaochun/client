$(function () {
  var isClient = (typeof chrome != 'undefined') && (typeof chrome.management != 'undefined');
  var Rt24 = {
    serverUrl: isClient ? 'http://rt24-labs.sh.intel.com' : '.',
    urlCheckAvailable: (isClient ? 'http://rt24-labs.sh.intel.com' : '.') + '/appinfo?category=',
    appSearchUrl: (isClient ? 'http://rt24-labs.sh.intel.com' : '.') + '/appinfo?search=',
    downloadTimesUrl: (isClient ? 'http://rt24-labs.sh.intel.com' : '.') + '/appinfo?download=',
    appImagePath: 'bin',
    defaultImagePath: 'image',
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
      default_icon: 'default_icon.png'
    }
  };
  
  var onMouseEnterTile = function() {
    var sender = $(this);
    var timeout = setTimeout(function() {
      if ($.browser.msie) {
        var opened = sender.attr('opened');
        if (typeof opened != 'undefined' && opened == 'true') {
          $(".row-fluid .rt24-span").unbind('mouseleave', onmouseleave);
          return;
        }
      }
      var left = $(this).width() + 6;
      sender.find(".rt24-thumb").animate({left: left+'px'}, 150);
    }, 300);
    
    var onmouseleave = function(){
      if ($.browser.msie) {
        var opened = sender.attr('opened');
        if (typeof opened != 'undefined' && opened == 'true') {
          $(".row-fluid .rt24-span").unbind('mouseleave', onmouseleave);
          return;
        }
      }
      sender.find(".rt24-thumb").animate({left: 0}, 150);
      clearTimeout(timeout);
      $(".row-fluid .rt24-span").unbind('mouseleave', onmouseleave);
    }
    
    $(".row-fluid .rt24-span").bind('mouseleave', onmouseleave);
  };
  
  var onClickTileInIE = function() {
    var sender = $(this);
    var a = sender.parent().find('.rt24-span[opened=true][appid!='+sender.attr('appid')+']')
      .removeAttr('opened')
      .find(".rt24-thumb")
      .animate({left: 0}, 150);
    
    var left = $(this).width() + 6;
    sender.attr('opened', 'true');
    sender.find(".rt24-thumb").animate({left: left+'px'}, 150);
  }
  
  var incDownloadTimes = function(btn) {
    var thumb = btn.parent().parent().prev();
    var downloadTxt = thumb.find('.rt24-downloads');
    var appid = thumb.parent().attr('appid');
    $.ajax({
      url: Rt24.downloadTimesUrl + appid,
      dataType: 'json',
      success: function(data) {
        var txt = data.result + (data.result > 1 ? ' downloads' : ' dowload');
        downloadTxt.html(txt);
      },
      error: function() {console.log('Add download times failed');}
    });
  }
  
  var onBtnInstallClick = function() {
    if ($(this).hasClass(Rt24.Css.disable))
      return;
    var name = $(this).parent().prev().prev().find('.rt24-app-name').children().eq(0).html();
    var version;
    if (Rt24.mode == Rt24.Mode.updates) {
      version = $(this).parent().prev().prev().find('.rt24-app-category').html();
      version = version.substr(1, version.length - 1);
    } else {
      version = $(this).parent().prev().prev().find('.rt24-app-name').children().eq(2).html();
      version = version.substr(2, version.length - 3);
    }
    var appid = $(this).parent().parent().parent().attr('appid');
    var url = Rt24.serverUrl + '/bin/' + appid + '/' + version + '/' + appid + '.crx';
    document.getElementById('plugin').install(url, name, function(result) {
      if (!result) {
        /*var installBtn = $('div.btn-install[appid='+btnInstall.attr('appid')+']').show();
        installBtn.next().hide();
        installBtn.next().next().hide();*/
      }
    })
    //$(this).hide();
    //$(this).next().next().show();
    
    incDownloadTimes($(this));
  };
  
  var onBtnDownloadClick = function() {
    incDownloadTimes($(this));
  };
  
  var onNavListItemClick = function(){
    if ($(this).parent().hasClass("active"))
      return;
    
    $(this).parent().parent().children().removeClass("active");
    $(this).parent().addClass("active");
    
    // Show Spiner
    $('.loading').show();
    
    // Clear current items.
    var appGrid = $('ul.thumbnails');
    appGrid.css('display','none');//.fadeOut(100);
    appGrid.children().remove();
    
    var category = $(this).attr('category')
    if (category == 'my') {
      Rt24.mode = Rt24.Mode.installed
      loadInstalled();
    } else if (category == 'updates') {
      Rt24.mode = Rt24.Mode.updates;
      checkUpdates();
    } else {
      Rt24.mode = Rt24.Mode.available;
      loadApps(category, $(this).text(), false);
    }
  };
  
  var renderTemplate = function(tmplId, data, target, btnCss) {
    var tmpl = $('#'+tmplId).html();
    for (i in data) {
      var instance = tmpl;
      
      if (data[i].description == null)
        data[i].description = "No description";
      
      if (data[i].icon == null)
        instance = instance.replace('bin/${app_id}/${icon}', Rt24.defaultImagePath + '/' + Rt24.Css.default_icon);
      
      if (!data[i].has_image)
        instance = instance.replace('${image_path}', Rt24.defaultImagePath);
      else
        instance = instance.replace('${image_path}', Rt24.appImagePath+'/'+data[i].app_id);
        
      
      for (key in data[i]) {
        var re = new RegExp('\\${'+key+'}', 'g');
        instance = instance.replace(re, data[i][key]);
      }
      var downloadText = data[i].download_times > 1 ? 'downloads' : 'download';
      instance = instance.replace(new RegExp('\\${download_text}', 'g'), downloadText);
      instance = instance.replace(new RegExp('\\${server_url}', 'g'), Rt24.serverUrl);
      instance = instance.replace(new RegExp('\\${btn_css}', 'g'), btnCss);
      var btnText = 'DOWNLOAD';
      if (isClient) {
        btnText = (btnCss == Rt24.Css.install ? 'INSTALL' : (btnCss == Rt24.Css.update ? 'UPDATE' : 'INSTALLED'));
        instance = instance.replace(new RegExp('\\${bin_url}', 'g'), 'javascript:void(0)');
      } else
        instance = instance.replace(new RegExp('\\${bin_url}', 'g'), './bin/'+data[i].app_id+'/'+data[i].version+'/'+data[i].url);
      instance = instance.replace(new RegExp('\\${btn_text}', 'g'), btnText);
      var tile = $(instance).appendTo(target).mouseenter(onMouseEnterTile);
      
      // Bind click event of install button.
      if (isClient)
        tile.find('.btn-mini').click(onBtnInstallClick);
      else
        tile.find('.btn-mini').click(onBtnDownloadClick);
        
      if ($.browser.msie)
        tile.click(onClickTileInIE);
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
        if (!apps)
          return;
        
        // Render the appTemplate with the "apps" data
        renderTemplate('appTemplate', apps, appGrid, Rt24.Css.install);
        
        
        
        var appStr = apps.length > 1 ? ' Applications' : ' Application';
        var header = $('<h2>'+title+' <small>'+apps.length+appStr+'</small></h2>');
        $('div.page-header').children().replaceWith(header);
        
        if (isClient) {
          chrome.management.getAll(function(apps) {
            for (var i in apps) {
              var btn = $('ul.thumbnails > li[appid='+apps[i].id+']').find('.btn-mini');
              if (!btn.hasClass(Rt24.Css.update))
                btn.removeClass(Rt24.Css.install).addClass(Rt24.Css.disable).text('INSTALLED');
            };
          });
        }
        $('.loading').hide();
        showUpdateBtn(Rt24.updateList);
        appGrid.fadeIn(1000);
      },
      error: function() {console.log('Get app info failed');}
    });
  };
  
  var loadInstalled = function() {
    if (!isClient)
      return;
    chrome.management.getAll(function(apps) {
      var appItems = new Array();
      for (var i in apps) {
        var app = apps[i];
        var appItem = {
          app_id: app.id,
          app_name: app.name,
          version: apps[i].version,
          description: app.description,
          server_url: Rt24.serverUrl
        }
        appItems.push(appItem);
      };
      var appGrid = $('ul.thumbnails');
      $('.loading').hide();
      renderTemplate('updateTmpl', appItems, appGrid, Rt24.Css.disable);
      appGrid.fadeIn();
      
      // Head text
      var appStr = apps.length > 1 ? ' Applications' : ' Application';
      var header = $('<h2>Updates <small>'+apps.length+appStr+'</small></h2>');
      $('div.page-header').children().replaceWith(header);
      
      // App images.      
      for(var i in apps)
        loadImage(apps[i]);
      
      showUpdateBtn(Rt24.updateList);
    });
  };
  
  var loadUpdates = function(apps) {
    var appItems = new Array();
    var count = 0;
    function showUpdateItem(appinfo) {
      chrome.management.get(appinfo.id, function(app){
        var appItem = {
          app_id: app.id,
          app_name: app.name,
          version: appinfo.version,
          description: app.description,
          server_url: Rt24.serverUrl
        }
        appItems.push(appItem);
        if (++count == apps.length) {
          var appGrid = $('ul.thumbnails');
          $('.loading').hide();
          renderTemplate('updateTmpl', appItems, appGrid, Rt24.Css.update);
          appGrid.fadeIn();
          
          // App images.
          for(var i in apps)
            loadImage(apps[i]);
        }
      });
    }
    for(var i in apps){
      showUpdateItem(apps[i]);
    }
    // Head text
    var appStr = apps.length > 1 ? ' Applications' : ' Application';
    var header = $('<h2>My Apps <small>'+apps.length+appStr+'</small></h2>');
    $('div.page-header').children().replaceWith(header);
    
    if (apps.length == 0) {
      $('.loading').hide();
      $('ul.thumbnails').fadeIn();
    }
    
  };
  
  var loadImage = function(appinfo) {
    var imageUrl = Rt24.serverUrl + '/bin/' + appinfo.id + '/cover.png';
    $.ajax({
      url: imageUrl,
      success: function() {
        $('ul.thumbnails > li[appid='+appinfo.id+']').find('.rt24-thumb').find('img').attr('src', imageUrl);
      },
      error: function() {console.log('Get app image failed');}
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
              .html(categories[i].name);
          }
          
          // Bind click event of nav list item.
          $("ul.rt24-nav > li > a").click(onNavListItemClick);
        }
      },
      error: function() {console.log('Get categories failed');}
    });
  }
  
  var checkUpdates = function() {
    // Let background.js to check update
    if (isClient)
      chrome.extension.sendMessage({name: 'check_update'});
  };

  var onUpdatesNotified = function(apps) {
    var count = apps.length;
    $('.rt24-nav').find('a[category=updates]').children().eq(0).html('Updates('+count+')');
    //$('div.navbar-fixed-top').find('ul.nav').children().eq(1).children().html('Updates('+count+')');
    
    if (Rt24.mode == Rt24.Mode.available || Rt24.mode == Rt24.Mode.installed) {
      showUpdateBtn(apps);
    } else if (Rt24.mode == Rt24.Mode.updates) {
      // Clear current items.
      var appGrid = $('ul.thumbnails');
      appGrid.css('display','none');//.fadeOut(100);
      appGrid.children().remove();
    
      loadUpdates(apps);
    }
    Rt24.updateList = apps;
  };
  
  var searchApp = function(keyword) {
    // Clear current items.
    var appGrid = $('ul.thumbnails');
    appGrid.css('display','none');//.fadeOut(100);
    appGrid.children().remove();
    
    if (keyword == '') {
      // Clear search result when keyword is empty.
      if (Rt24.mode == Rt24.Mode.available) {
        var item = $('ul.rt24-nav > li.active').children();
        var category = item.attr('category');
        var title = item.html();
        loadApps(category, title, false);
      } else if (Rt24.mode == Rt24.Mode.updates) {
        checkUpdates();
      }
    } else
      loadApps(keyword, 'Search Result', true);
  };
  
  // Bind search event
  $('input.search-query').keydown(function(event){
    if(event.keyCode == 13){
      searchApp($(this).val());
    } else if (event.keyCode == 8 && $(this).val().length == 1) {
      searchApp('');
    }
  });
  
/*   $('.rt24-mode').click(function(){
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
      checkUpdates();
    }
  }); */
  
  // Bind chrome events.
  if (isClient) {
    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.name == "update_notifiy") {
        // Refresh app list;
        onUpdatesNotified(request.updates);
      }
    });
    
    chrome.management.onInstalled.addListener(function(info) {
      if (!info.isApp)
        return;
      
      if (Rt24.mode == Rt24.Mode.installed && $('ul.thumbnails > li[appid='+info.id+']').length == 0) {
        var appItems = new Array();
        var appItem = {
          app_id: info.id,
          app_name: info.name,
          version: info.version,
          description: info.description,
          server_url: Rt24.serverUrl
        };
        appItems.push(appItem);
        var appGrid = $('ul.thumbnails');
        renderTemplate('updateTmpl', appItems, appGrid, Rt24.Css.disable);
        loadImage(info);
      } else if (Rt24.mode != Rt24.Mode.update) {
        $('ul.thumbnails > li[appid='+info.id+']').find('.btn-mini')
        .removeClass(Rt24.Css.install)
        .removeClass(Rt24.Css.update)
        .addClass(Rt24.Css.disable)
        .text('INSTALLED');
      }
    });
    
    chrome.management.onUninstalled.addListener(function(id) {
      if (Rt24.mode == Rt24.Mode.available) {
        $('ul.thumbnails > li[appid='+id+']').find('.btn-mini')
        .removeClass(Rt24.Css.disable)
        .removeClass(Rt24.Css.update)
        .addClass(Rt24.Css.install)
        .text('INSTALL');
      } else {
        $('ul.thumbnails > li[appid='+id+']').remove();
      }
    });
  }
  
  loadCategories();
  loadApps('new', 'New', false);
  
  function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i=0; i<ARRcookies.length; i++) {
      x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
      y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
      x = x.replace(/^\s+|\s+$/g,"");
      if (x == c_name)
        return unescape(y);
    }
  }
  
  function setCookie(c_name, value, exdays) {
    var exdate =new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
  }
  
  if (isClient) {
    checkUpdates();
    $('.rt24-page-elem').hide();
    $('.rt24-client-elem').show();
    $('.bs-docs-sidenav').affix({
      offset: {
        top: function () {return $(window).width() <= 980 ? 70 : 1}
      }
    });
  } else {
    $('.rt24-page-elem').show();
    $('.rt24-client-elem').hide();
    $('.jumbotron').show()
    
    var userName = getCookie('username');
    if (userName == null) {
      $('.dropdown').hide();
    } else {
      var items = $('.navbar-fixed-top').find('ul.nav').children();
      items.eq(2).hide();
      items.eq(3).hide();
      $('li.dropdown > a').html('@' + userName + '<b class="caret"></b>');
      $("#signOutBtn").click(function () {
        $.post("user", {action : "sign_out"}, function (data) {
          if (data.url)
            location.href = data.url;
        });
      });
    }
    
    $('.bs-docs-sidenav').affix({
      offset: {
        top: function () {return $(window).width() <= 980 ? 190 : 140}
      }
    });
    
    var isVisited = getCookie('visited');
    if (isVisited == null || isVisited != 'true') {
      $('#aboutModal').modal();
      setCookie('visited', 'true', 10000);
    }
  }
});