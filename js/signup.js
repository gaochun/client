$(document).ready(function () {
  
  $('input[name=password]').focusin(function () {
    $('input[name=password]').popover('focus');
  });
  
  $('input[name=password]').focusout(function () {
    $('input[name=password]').popover('hide');
  });
  
  $('form[name=signUpForm]').submit(function (event) {
    $('div[class="alert alert-error"]').fadeOut();
    event.preventDefault();
    var $form = $(this);
    var _username = $form.find('input[name="username"]').val();
    var _password = $form.find('input[name="password"]').val();
    var _confirm_password = $form.find('input[name="confirm_password"]').val();
    var _url = $form.attr('action');
    
    if (_username.length == 0 || _password.length == 0 || _confirm_password.length == 0) {
      $('div[class="alert alert-error"]').html("<strong>Warning!</strong> Please input completely.");
      $('div[class="alert alert-error"]').fadeIn();
      return;
    }
    
    if (_password != _confirm_password) {
      $('div[class="alert alert-error"]').html('<strong>Warning!</strong> Password and confirmed password do not match');
      $('div[class="alert alert-error"]').fadeIn();
      return;
    }
    
    if (_password.length < 6 || _password.length > 20) {
      $('div[class="alert alert-error"]').html('<strong>Warning!</strong> The Password should longer than 6 and lesser than 20');
      $('div[class="alert alert-error"]').fadeIn();
      return;
    }
    
    $.post(_url, {
      action : "sign_up",
      username : _username,
      password : hex_md5(_password)
    }, function (data) {
      if (data.Success) {
        $('div[class="alert alert-error"]').removeClass('alert-error')
          .html('<strong>Congratulate! </strong>' + data.Message + '. Redirecting to sign in');
        $('div[class="alert"]').fadeIn();
        setTimeout(function () {
          location.href = data.url;
        }, 2000);
        //location.href = data.url;
      } else {
        $('div[class="alert alert-error"]').html('<strong>Warning!</strong>' + ' ' + data.Message);
        $('div[class="alert alert-error"]').fadeIn();
      }
    }, 'json');
  });
});