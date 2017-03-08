//**************************************************************************************//
//*********************** CHAT - MENSAGENS ENTRE USUÁRIOS ******************************//
//**************************************************************************************//
$(document).ready(function () {

  $.fn.clearForm = function () {
    return this.each(function () {
      var type = this.type, tag = this.tagName.toLowerCase();
      if (tag == 'form')
        return $(':input', this).clearForm();
      if (type == 'text' || type == 'password' || tag == 'textarea')
        this.value = '';
      else if (type == 'checkbox' || type == 'radio')
        this.checked = false;
      else if (tag == 'select')
        this.selectedIndex = -1;
    });
  };

  $(window).resize(function () {
    resizeMenuConversations();
    resizeInboxUser();
  });

  var readConversation = function (conversationId, force) {
    if ($('#unreadconversation_' + conversationId).length > 0 || force) {
      console.log('Evento "read conversation" disparado para conversa ' + conversationId);
      $.ajax({
        url: '/notifications/readconversation',
        type: 'POST',
        data: {conversation_id: conversationId},
        dataType: 'json',
        success: function (response) {
          socket.emit('read conversation', conversationId, response.updated_at);
          console.log(response.message);
        },
        error: function (response) {
          console.log(response);
          console.log('Erro ao ler conversa');
        }
      });

      var bubble = parseInt($('.alert_conversations').html(), 10);
      if (bubble != '' && !isNaN(bubble) && bubble > 0) {
        $('#unreadconversation_' + conversationId).remove();
        if (bubble > 1) {
          $('.alert_conversations').html(--bubble);
        } else {
          $('.alert_conversations').hide();
          $('.alert_conversations').html(0);
          $('a.messages').attr('href', '/messages');
        }
      }
    }
  }

  window.addEventListener("focus", function (event) {
    if ($("#new-message-show-and-not-read").val() == '1') {
      $("#new-message-show-and-not-read").val('0');
      readConversation($('input[name="conversation_id"]').val(), true);
    }
  }, false);

  if ($('#inbox-user').length > 0) {
    resizeMenuConversations();
    resizeInboxUser();

    setTimeout(function () {
      moveScroollInboxUser();
    }, 100);

    if ($('input[name="conversation_id"]').length > 0) {
      readConversation($('input[name="conversation_id"]').val());
    }
  }

//  $(".textarea-message-user-width-enter").live('keydown', function(e) {
//    if (e.keyCode == 13 && !e.shiftKey) {
//      e.preventDefault();
//      var data = $(this).val();
//      $(this).html(data.replace(/<\S*script*>/, ''));
//      $("#form-new-message").submit();
//    }
//  });

  $('#profile-newconversation').on('selectregistry', function (event, data) {
    var profile = data.registry;
    $.ajax({
      type: "post",
      dataType: "json",
      url: '/messages/newconversation',
      data: {
        profile_id: profile.id
      },
      success: function (response) {
        if (typeof response.error == 'undefined') {
          window.location.replace('/messages/index/id/' + response.data);
        } else {
          showAlertGeneral('danger', response.message);
        }
      },
      error: function (response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          return false;
        }
      }
    });
    return false;
  });

  $("#btn-show-form-add-memberconversation").click(function () {
    $("#div-form-config-conversation").hide();
    var top = $(this).offset().top - $('.menu-top').height();
    if ($("#btn-show-form-config-conversation").length > 0) {
      var left = $('.header').width() - $("#div-form-add-member-conversation").width() - 40;
    } else {
      var left = $('.header').width() - $("#div-form-add-member-conversation").width() + 10;
    }
    $("#div-form-add-member-conversation").css('top', top);
    $("#div-form-add-member-conversation").css('left', left);
    $("#div-form-add-member-conversation").show();
  });

  $("#cancel-addmemberconversation").click(function () {
    $("#div-form-add-member-conversation").hide();
    $("#new-profiles-id-conversation").val('');
    $("#new-members-conversation ul").html('');
  });

  $("#btn-show-form-config-conversation").click(function () {
    $("#div-form-add-member-conversation").hide();
    var top = $(this).offset().top - $('.menu-top').height();
    var left = $('.header').width() - $("#div-form-add-member-conversation").width() + 10;
    $("#div-form-config-conversation").css('top', top);
    $("#div-form-config-conversation").css('left', left);
    $("#div-form-config-conversation").show();
  });

  $("#cancel-config-conversation").click(function () {
    $("#div-form-config-conversation").hide();
  });

  $('#profile-addmemberconversation').on('selectregistry', function (event, data) {
    var profile = data.registry;
    var ids = $('#new-profiles-id-conversation').val().split(',');
    if ($.inArray(profile.id, ids) == -1) {
      ids.push(profile.id);
      ids = ids.join(',');
      $('#new-profiles-id-conversation').val(ids);
      $('#new-members-conversation ul').append('<li id="new-member_' + profile.id + '" class="new-member">'
        + '<img src="' + profile.image + '"/><span>'
        + profile.value + '</span><a id="link-remove-member_' + profile.id + '" href="#" class="link-remove-member pull-right"><i class="icon-remove"></i></a></li>'
        );
    }
    $('#profile-addmemberconversation').val('');
    $('#profile-id-addmemberconversation').val('');
  });

//  $(".link-remove-member").live('click', function() {
//    var id = $(this).attr("id").split('_')[1];
//    var ids = $('#new-profiles-id-conversation').val().split(',');
//    if ($.inArray(id, ids) >= 0) {
//      ids.splice(ids.indexOf(id), 1);
//      ids = ids.join(',');
//      $('#new-profiles-id-conversation').val(ids);
//    }
//    $("#new-member_" + id).remove();
//    return false;
//  });

  $("#form-add-members-conversation").submit(function () {
    $.ajax({
      type: "post",
      dataType: "json",
      url: '/messages/addmemberconversation',
      data: $(this).serialize(),
      success: function (response) {
        if (typeof response.error == 'undefined') {
          window.location.replace('/messages/index/id/' + response.data);
        } else {
          showAlertGeneral('danger', response.message);
        }
      },
      error: function (response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          return false;
        }
      }
    });
    return false;
  });

  $("#form-config-conversation").submit(function () {
    $.ajax({
      type: "post",
      dataType: "json",
      url: '/messages/configconversation',
      data: $(this).serialize(),
      success: function (response) {
        if (typeof response.error == 'undefined') {
          var id = $('#conversation-id-config').val();
          $('.group_name_' + id).html($('input#group_name').val());

          if ($('input#group_name').val() != '') {
            $('.sidebar_group_name_' + id).html($('input#group_name').val());
          } else {
            $('.sidebar_group_name_' + id).html($('.sidebar_group_name_' + id).attr('title'));
          }

          $("#div-form-config-conversation").hide();
          showAlertGeneral('success', response.message);
        } else {
          showAlertGeneral('danger', response.message);
        }
      },
      error: function (response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          return false;
        }
      }
    });
    return false;
  });

  $('#newMessageUser').click(function () {
    $('#form-new-message').fadeIn();
  });

  $('#cancelMessageUser').click(function () {
    $('.form-new-message-fadeout').fadeOut();
    $('#previewActivity').html('').hide();
    $('#message-profile').val('');
    $('#mediaPreview').val('');
    resizeInboxUser();
  });

  $("#form-new-message").submit(function () {
    if ($('#message-profile').val() == '' && $('#mediaPreview').val() == '') {
      return false;
    }
    var obj = $(this);
    $.ajax({
      type: "post",
      dataType: "json",
      url: '/messages/new',
      data: $(this).serialize(),
      beforeSend: function () {
        $('.chat-btn').prop('disabled', true);
      },
      success: function (response) {
        if (response == null) {
          return false;
        }
        if (typeof response.error == 'undefined') {
          var message = $('#message-profile').val();
          $('#form-new-message').clearForm();

          var callback = function () {
//            updateRelatedPosts(message);
            if ($('#inbox-user').length > 0) {
              var last_id = '#' + $('#list_messages li:last').attr('id');
              if ($(last_id).hasClass('message_' + response.data.user_id) &&
                (response.data.time - $(last_id).attr('last-update')) <= 30) {
                $(last_id).attr('last-update', response.data.time);
                $(last_id + ' .date_time').html(response.data.date);
                $(last_id + ' .text-post').append('<br>' + response.data.message);
              } else {
                $('#list_messages').append(response.data.html_local);
              }
              $('#list_messages .activity-media-gallery').slick({dots: true});

              $('#inbox-user-message-notfound').hide();
              moveScroollInboxUser();
            } else {
              showAlertGeneral('success', 'Mensagem enviada com sucesso.');
            }

            $form = obj;
            $('.input-medias', $form).val('');

            if (!$('.input-value', $form).hasClass('parse-link') && !$('.input-value', $form).hasClass('poll-description')) {
              $('.input-value', $form).addClass('parse-link');
            }
            $('.form-activity-file').show();

            $('.upload-preview .preview,.upload-preview .preview-file div,.previewMedia', $form).html('');
            $('.upload-preview .preview,.upload-preview .preview-file,.previewMedia', $form).hide().unslick();

            $('#previewActivity').html('').hide();
            $('#message-profile').val('');
            $('#status-conversation').html('');
          };
          if ($(obj).hasClass('form-new-message-fadeout')) {
            $('.form-new-message-fadeout').fadeOut(callback());
          } else {
            callback();
          }
          socket.emit('new message', response.data.conversation_id, response.data, response.data.html_sender);
        } else {
          showAlertGeneral('danger', response.message);
        }
      },
      error: function (response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          return false;
        }
      },
      complete: function (response) {
        $('.chat-btn').prop('disabled', false);
        $('#form-new-message').find('input[type=checkbox]').attr('checked', false);
        $('#mediaPreview').val('');
        resizeInboxUser();
      }
    });
    return false;
  });

  $('#inbox-user').scroll(function (e) {
    if ($("#inbox-user").scrollTop() == 0) {
      var page = $("input#next_page").val();
      var id = $("input#conversation_id").val();

      if ($('#inbox-user').find('#begin-conversation').length == 0 &&
        $('#inbox-user').find('#loading-messages').length == 0) {

        $.ajax({
          type: "GET",
          dataType: "html",
          url: '/messages/pagination/id/' + id + '/page/' + page,
          beforeSend: function () {
            $('#inbox-user').prepend('<img src="/img/loading.gif" alt="Carregando" id="loading-messages" />');
          },
          success: function (response) {
            if (response) {
              page = parseInt(page) + 1;
              $("input#next_page").val(page);

              var scrolltop = $("#inbox-user").scrollTop() + 100;
              var old_height = $('#inbox-user')[0].scrollHeight;

              $('ul#list_messages').prepend(response);
              var new_height = $('#inbox-user')[0].scrollHeight;
              $("#inbox-user").scrollTop((new_height - old_height) + scrolltop);
            } else {
              $('#inbox-user').prepend('<div id="begin-conversation" class="alert alert-info">Início da Conversa.</div>');
            }
          },
          complete: function () {
            $("#loading-messages").remove();
          }
        });
      } else {
        console.log('Requisição de load messages recusada');
      }
    }
  });

//  if (notify.permissionLevel() != notify.PERMISSION_GRANTED) {
//    $("#allow-chat-notifications").show();
//    resizeInboxUser();
//  } else if (notify.permissionLevel() === notify.PERMISSION_DENIED){
//    $("#chat-notifications-deny").show();
//  }

  $('#allow-chat-notifications').click(function () {
    $(this).fadeOut(500);
    notify.requestPermission();
  });

});

function moveScroollInboxUser() {
  $("#inbox-user").scrollTop($("#inbox-user")[0].scrollHeight);
}

function resizeInboxUser() {
  if ($('#inbox-user').length > 0) {
    //var diffPaddingInbox = 18;
    var diffPaddingInbox = 142;
    var height = $(window).height() - $('#header-inbox-user').height() - $('#form-page-inbox').height() - diffPaddingInbox;
    $('#inbox-user').height(height);
  }
}

function resizeMenuConversations() {
  if ($('#itens-conversation').length > 0) {
    //var diffPaddingInbox = 8;
    var diffPaddingInbox = 151;
    var height = $(window).height() - $('#header-menu-conversations').height() - diffPaddingInbox;
    $('#itens-conversation').height(height);
  }
}

