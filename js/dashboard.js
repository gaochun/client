UserApps = {
  apps : new Array(),
  indexToBeRemoved : -1,
  indexToBeUpdated : -1, // this also can be used for distinguish whether it is update or new app
  
  //Insert the web app item to the current user table
  insertAppitem : function (item) {
    UserApps.apps.push(item);
    
    var row = $('<tr></tr>');
    var appicon = $("<img />").attr({
        src : '/bin/' + item.app_id + '/' + item.icon
      });
    appicon.addClass("appicon");
    $('<td style="min-width: 54px;"></td>').html(appicon).appendTo(row);
    $('<td></td>').html(item.app_name).appendTo(row);
    $('<td></td>').html(item.version).appendTo(row);
    $('<td style="text-transform:capitalize"></td>').html(item.category).appendTo(row);
    $('<td style="max-width:350px"></td>').html(item.description).appendTo(row);
    var updateBtn = $('<a href="javascript:void(0);">Update</a>');
    var deleteBtn = $('<a href="javascript:void(0);">Delete</a>');
    $('<td></td>').append(updateBtn).append("|").append(deleteBtn).appendTo(row);
    $('#appsTable > tbody').append(row);
    
    deleteBtn.click(function () {
      UserApps.indexToBeRemoved = $(this).parent().parent()[0].rowIndex - 1;
      $('#deletePromoteModal').modal("show");
    });
    
    updateBtn.click(function () {
      var index = $(this).parent().parent()[0].rowIndex - 1;
      UserApps.indexToBeUpdated = index;
      $('#uploadModalLabel').html("App update: " + UserApps.apps[index].app_name);
      $('#uploadModal').modal("show");
      $('#deploy-combo').val(UserApps.apps[index].category);
    });
  },
  
  // remove the seleceted app
  removeAppitem : function (i) {
    $.post("/user", {
      action : "remove",
      app_id : UserApps.apps[i].app_id
    }, function (data) {
      console.log(data.result);
      if (data.result == true) {
        $('#appsTable > tbody').children().eq(i).fadeOut('slow', function () {
          $(this).remove();
        });
        UserApps.apps.splice(i, 1);
      }
    }, 'json');
  }
}

function delCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function getCookie(c_name) {
  var i, x, y, ARRcookies = document.cookie.split(";");
  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x == c_name) {
      return unescape(y);
    }
  }
}

$(document).ready(function () {
  var getUserApps = $.post("/user", {
      action : "get_user_apps"
    }, function (data) {
      if (data.url) {
        // delete the cookie to advoid the circular references
        // between the login.html and the dashboard.html
        delCookie('JSESSIONID');
        delCookie('username');
        location.href = data.url;
      } else {
        for (var i = 0; i < data.length; i++) {
          UserApps.insertAppitem(data[i]);
        };
        $('.loading').fadeOut('slow');
      }
    });
  
  getUserApps.error(function () {
    location.href = "index.html";
  });
  
  var username = getCookie("username");
  $('button.username').html(username);
  
  $('#uploadBtn').click(function () {
    // this is used for distinguish whether it is update or new
    UserApps.indexToBeUpdated = -1;
    $('#uploadModalLabel').html("Deploy a new app");
    $('#deploy-combo').val("education");
    $('#uploadModal').modal({
      keyboard : false,
      backdrop : "static",
      show : true
    });
    $('div[class="modal-backdrop fade in"]').attr('disabled', 'disabled');
  });
  
  $('#deployBtn').click(function () {
    // Advoid the second click the deploy btn.
    if ($('#aIframe').contents().find("p").html() == "true") {
      return;
    }
    if ($('#zipFile').val() == "") {
      return;
    }
    var btn = $(this);
    btn.button('loading');
    $('#uploadModal>.modal-footer>button[data-dismiss="modal"]').attr('disabled', 'disabled');
    $('#uploadModal>.modal-header>button[data-dismiss="modal"]').attr('disabled', 'disabled');
    
    if (UserApps.indexToBeUpdated == -1) {
      // New app
      $('#deploy-form').attr('action', '/user?action=deploy&category=' + $('#deploy-combo').val());
      $('#deploy-form').submit();
    } else if (UserApps.indexToBeUpdated >= 0 && UserApps.indexToBeUpdated < UserApps.apps.length) {
      // update the selected app
      $('#deploy-form').attr('action', '/user?action=deploy&category=' + $('#deploy-combo').val()
         + '&uuid=' + UserApps.apps[UserApps.indexToBeUpdated].app_id);
      $('#deploy-form').submit();
    }
  });
  
  $('input[id=file-field]').change(function () {
    $('#zipFile').val($(this).val());
    
  });
  
  $.ajax({
    url : 'extra/categories.json',
    dataType : 'json',
    success : function (data) {
      var ul = $('<ul>').appendTo($('nav.categories'));
      for (i in data) {
        $('<option>').attr('value', data[i].data).html(data[i].name).appendTo($('#deploy-combo'));
      }
    },
    error : function () {
      console.log('Get categories failed');
    }
  });
  
  $("#signOutBtn").click(function () {
    $.post("/user", {
      action : "sign_out"
    }, function (data) {
      if (data.url) {
        location.href = data.url;
      }
    });
  });
  
  $('button.btn-danger').click(function () {
    $('#deletePromoteModal').modal("hide");
    UserApps.removeAppitem(UserApps.indexToBeRemoved);
  });
  
  // For Compatibility of Opera and Safari
  if (navigator.userAgent.indexOf('Opera') >= 0 ||
    (navigator.userAgent.indexOf('Safari') >= 0 && navigator.userAgent.indexOf('Chrome') == -1)) {
    $('#file-field').css('display', 'block');
    $('#file-field').css('visibility', 'hidden');
  }
  // For Compatibility of IE. because the IE doesn't allow manipulation
  // of the type="file" input element from javascript due to security reasons.
  if (navigator.userAgent.toLowerCase().match(/msie ([\d.]+)/)) {
    $('div.input-append').css('display', 'none');
    $('input[id=file-field]').css('display', 'block');
  }
  
  var userName = getCookie('username');
  if (userName != null)
    $('.dropdown > a').html('@' + userName + '<b class="caret"></b>');
});