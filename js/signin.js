if (getCookie("username") != null) {
  location.href = "dashboard.html";
}

$(document).ready(function () {
  $('form[name=loginForm]').submit(function (event) {
    $('div[class="alert alert-error"]').fadeOut();
    event.preventDefault();
    var $form = $(this);
    var _username = $form.find('input[name="username"]').val();
    var _password = $form.find('input[name="password"]').val();
    var _url = $form.attr('action');
    if (_username.length == 0 || _password.length == 0) {
      $('div[class="alert alert-error"]').html("<strong>Warning!</strong> Please input completely.");
      $('div[class="alert alert-error"]').fadeIn();
      return;
    }
    $.post(_url, {
      action : "sign_in",
      username : _username,
      password : _password
    }, function (data) {
      if (data.Success) {
        location.href = data.url;
      } else {
        $('div[class="alert alert-error"]').html("<strong>Warning!</strong> Username or password is wrong.");
        $('div[class="alert alert-error"]').fadeIn();
      }
    }, 'json');
  });
});

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