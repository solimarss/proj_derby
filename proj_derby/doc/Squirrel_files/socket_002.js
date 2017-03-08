$(document).ready(function() {

  try {
    socket = io.connect(portal.notificationEngine_uri);
  } catch (err) {
    console.log('Erro ao se conectar na API de notificação!' + err);
    var mock = function() {
    };
    socket = {emit: mock, on: mock};
  }

  // Identifica o usuário que se conectou ao servidor
  if (typeof profileSocket != 'undefined') {
    socket.emit('init', profileSocket);
    console.log('Socket inicializado');
  }

  /**
   * Servidor envia um objeto de post/atividade recente
   * e pertinente ao usuário logado
   **/
  socket.on('timeline updated', function() {
    console.log('timeline updated');
    if (isGroupRealtime()) {
      return false;
    }
    var alert_activity_timeline = $('.alert_activity_count').html() * 1;
    if (alert_activity_timeline == 0) {
      complement = ' nova atualização';
    } else {
      complement = ' novas atualizações';
    }
    $('.alert_activity_timeline').fadeIn();
    $('.alert_activity_count').html(alert_activity_timeline + 1);
    $('.alert_activity_text').html(complement);
    
    
    $('#tab-business a span').addClass('badge');
    $('#tab-business a span').html(alert_activity_timeline + 1);
    if ($('#tab-flow').hasClass('active')) {
      localStorage.setItem("timeline-business", alert_activity_timeline + 1);
    }
    
  });

  /**
   * Servidor envia um objeto de notificação para ser
   * adicionado à lista de notificações não lidas
   **/
  socket.on('new notification', function(notification) {
    console.log('Nova Notificação');
    console.log(notification);
    if (notification.image) {
      if (notification.image.substr(0, 4) == 'http') {
        var imageNotification = notification.image;
      } else {
        var imageRel = notification.image.charAt(0) !== '/' ? '/' + notification.image : notification.image;
        var imageNotification = portal.media_server + imageRel;
      }
    } else {
      var imageNotification = '/img/ciranda.ico';
    }
    var thumbNotification = '';
    if (notification.thumbnail !== '' && notification.thumbnail !== null) {
      var thumbRel = notification.thumbnail.charAt(0) !== '/' ? '/' + notification.thumbnail : notification.thumbnail;
      thumbNotification = '<img class="thumbnail-notify" src="' + portal.media_server + thumbRel + '" />';
    }    
    $('#notifications-list').prepend('<li class="unread" id="notify_' + notification._id + '">'+
      '<a href="' + notification.link + '"><img class="img-circle" src="' + imageNotification + '"/>' + 
      '<p class="message-notify">' + notification.message + '</p>' + thumbNotification +       
      '<p class="date-notify date_time" title="' + notification.created_at + '">' + notification.created_at + '</p>' +
      '</a></li>');  

    if ($("#notifications-dropdown").hasClass('open')) {
      console.log('Leu as Notificações');
      socket.emit('read notifications');
      $('.alert_global').html(0);
      iconBubble('reset');
    } else {
      var counter = $('.alert_global').html() != '' ? parseInt($('.alert_global').html(), 10) : 0;
      $('.alert_global').html(counter + 1);
      iconBubble();
    }
  });

  /**
   * CHAT
   **/
  socket.on('new message', function(conversationId, message, htmlSender, user) {
    console.log('Evento: new message');
    var isWindowFocused = document.querySelector(':focus') === null ? false : true;
    if ($('#conversation-id_' + conversationId).length > 0) {
      $('#inbox-user-message-notfound').hide();
      var last_id = '#' + $('#list_messages li:last').attr('id');
      if ($(last_id).hasClass('message_' + message.user_id) &&
              (message.time - $(last_id).attr('last-update')) <= 30) {
        $(last_id).attr('last-update', message.time);
        $(last_id + ' .date_time').html(message.date);
        $(last_id + ' .text-post').append('<br>' + message.message);
      } else {
        $('#list_messages').append(htmlSender);
      }
      $("#inbox-user").scrollTop($("#inbox-user")[0].scrollHeight);
      //updateRelatedPosts(message.message_textplain);

      if (isWindowFocused) {
        $.ajax({
          url: '/notifications/readconversation',
          type: 'POST',
          data: {conversation_id: conversationId},
          dataType: 'json',
          success: function(response) {
            socket.emit('read conversation', conversationId, response.updated_at);
            console.log(response.message);
          },
          error: function(response) {
            console.log('Erro ao ler conversa');
          }
        });    
      } else {
        $('#new-message-show-and-not-read').val('1');
      }
    } else {
      if (user.id != profileSocket.id) {
        if (!isWindowFocused) {
          EvalSound("sound-notification");
        }
        $("#item-conversation_" + conversationId).removeClass('read').addClass('unread');
        
        var msgTotal = 0;
        msgTotal = ($("#item-conversation_" + conversationId + " span span").text()*1) + 1;
        $("#item-conversation_" + conversationId + " span").remove();
        $("#item-conversation_" + conversationId).append('<span>(<span>' + msgTotal + '</span>)</span>');

        if ($('#unreadconversation_' + conversationId).length == 0) {
          var counter = $('.alert_conversations').html() != '' ? parseInt($('.alert_conversations').html(), 10) : 0;
          $('.alert_conversations').html(counter + 1);
          iconBubble();

          $('#notifications-message-dropdown a.dropdown-toggle').attr('data-toggle', 'dropdown');
          $('#notifications-message-dropdown a.dropdown-toggle').attr('href', '#');
          $('#notifications-message-list').append(
            '<li id="unreadconversation_' + conversationId + '" class="unread">' +
            '  <a href="/messages/index/id/' + conversationId + '">' + message.name_conversation + '</a>' +
            '</li>'
          );
        }
      }
    }

    if ($('#conversation-id_' + conversationId).length == 0 || !isWindowFocused) {
      if (user.id != profileSocket.id) {
        if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
          var goTab = function(){
            window.focus();
          };          
          notify.config({
            autoClose: 5000
          });
          notify.createNotification(user.name + ' diz:', {
            body: message.message_textplain, 
            icon: portal.media_server + '/' + user.avatar,
            onclick: goTab,
            tag: message.id
          });
        }
      }
    }
  });

  socket.on('read conversation', function(conversationId, user, updatedAt) {
    if ($('#conversation-id_' + conversationId).length > 0) {
      var html = $("#status-conversation").html();
      if ($("#conversation_type").val() == 'private') {
        html = 'Visualizado <span class="date_time" title="' + updatedAt + '">' + updatedAt + '</span>';
      } else {
        var nameUser = user.name.split(' ')[0];
        if (html.trim() == '') {
          html = 'Visualizado por ' + nameUser;
        } else {
          html = html + ', ' + nameUser;
        }
      }
      $("#status-conversation").html(html);
    }
  });


  /**
   * Enquete realtime
   **/
  socket.on('stack updated', function(activity) {
    if ($('ul.realtime #' + activity + '_answers_count').length > 0 || isGroupRealtime()) {

      var totalObject = $('#' + activity + '_answers_count');
      $.post('/stack/index/getvotes', {
        activity_id: activity
      }, function(data) {
        data = JSON.parse(data);
        total = data.total;
        $(totalObject).html(total);

        for (var i in data.values) {
          $('#status_option_' + data.values[i].id).attr('title', data.values[i].value);
          var value = parseInt(data.values[i].value, 10);
          var status = (value * 100 / total);
          $('#status_option_' + data.values[i].id).progressbar('option', 'value', status);
          $('#' + data.values[i].id + '_option_votes').html(value);
        }
      });
    }
  });

  /**
   *
   * TIMELINE DE GRUPO REALTIME
   * 
   **/

  // Verifica se o usuário está visualizando uma timeline de grupo realtime
  function isGroupRealtime() {
    return $('.body.realtime').length > 0;
  }

  function updateLikeHtml(parent_type, parent, operation) {
    var likes_count = $('#' + parent_type + '_' + parent + '_likes_count');
    if (likes_count.length > 0) {
      if (operation == 'like') {
        var count = parseInt(likes_count.html()) + 1;
        if (!count) {
          count = 1;
        }
      } else {
        var count = parseInt(likes_count.html()) - 1;
      }

      var plural = count > 1 ? ' curtiram' : ' curtiu';

      likes_count.fadeOut(200, function() {
        $(this).html(count + plural);
        if (count >= 1) {
          $('#' + parent_type + '_' + parent + '_post_e').fadeIn();
          likes_count.fadeIn();
        } else {
          $('#' + parent_type + '_' + parent + '_post_e').fadeOut();
          likes_count.fadeOut();
        }
      });
    } else {
      return false;
    }
  }

  function EvalSound(soundobj) {
    var thissound = document.getElementById(soundobj);
    thissound.play();
  }

  if (isGroupRealtime()) {
    socket.on('new activity', function(group_id, activityHtml) {
      var $ul = $('ul#' + group_id + '.lista_timeline');
      if ($ul.length > 0) {
        $(activityHtml).hide().prependTo($ul).slideDown();
      }
    });

    socket.on('new poll', function(group_id, pollHtml) {
      var $ul = $('ul#' + group_id + '.lista_timeline');
      if ($ul.length > 0) {
        $(pollHtml).hide().prependTo($ul).slideDown();
        $(pollHtml).find(".poll-status").each(function(i) {
          var $id = $(this).attr('id');
          $("#" + $id).progressbar({value: 0});
        });
      }
    });

    socket.on('new comment', function(type, parent_id, commentHtml) {
      var $ul = $("li#" + type + "_" + parent_id + " div.comments ul").first();
      if ($ul.length > 0) {
        $(commentHtml).hide().appendTo($ul).slideDown();
        var $activity = $ul.parents('li.history')
                , originalColor = $activity.css('backgroundColor');

        $ul.parents('li.history').stop()
                .css('background-color', '#FAFAD2')
                .animate({backgroundColor: originalColor}, 2000);
      } else {
        return false;
      }
    });

    socket.on('new subcomment', function(comment_id, subCommentHtml) {
      var $ul = $("li#comment_" + comment_id + " div.subcomments ul").first();
      if ($ul.length > 0) {
        $(subCommentHtml).hide().appendTo($ul).slideDown();
        var $activity = $ul.parents('li.history')
                , originalColor = $activity.css('backgroundColor');

        $ul.parents('li.history').stop()
                .css('background-color', '#FAFAD2')
                .animate({backgroundColor: originalColor}, 2000);
      } else {
        return false;
      }
    });

    socket.on('new like', function(parent_type, parent) {
      return updateLikeHtml(parent_type, parent, 'like');
    });

    socket.on('new unlike', function(parent_type, parent) {
      return updateLikeHtml(parent_type, parent, 'unlike');
    });

    socket.on('remove activity', function(activity_id) {
      $("#activity_" + activity_id).fadeOut('slow', function() {
        $(this).remove();
      });
    });

    socket.on('remove stack', function(stack) {
      $("#poll_" + stack).fadeOut('slow', function() {
        $(this).remove();
      });
    });

    socket.on('remove comment', function(comment) {
      $("#comment_" + comment).fadeOut('slow', function() {
        $(this).remove();
      });
    });

    socket.on('remove subcomment', function(comment) {
      $("#subcomment_" + comment).fadeOut('slow', function() {
        $(this).remove();
      });
    });
  }

  // implementação para Robô do Twitter

  socket.on('new tweet', function(group_id, activityHtml) {
    var $ul = $('ul#' + group_id + '.lista_timeline');
    if ($ul.length > 0) {
      $(activityHtml).hide().prependTo($ul).slideDown();
    }
  });

  socket.on('new user', function(blogId, name, avatar) {
    if ($('#new-users-' + blogId).length === 0) return;
    var time = new Date().toISOString();
    $('#new-users-' + blogId).prepend(
      '<li><img src="' + avatar + '" class="img-circle"><span class="name">' + name + '</span><span class="date_time" title="' + time + '"></span></li>'
    );
  });

  socket.on('flow updated', function(areas) {
    console.log('RECEBIDO flow updated -> ' + areas);
    
    var containsArea = false;
    console.log(profileSocket.currentFilterInterestAreas);
    if (profileSocket.currentFilterInterestAreas.length > 0) {
      profileSocket.currentFilterInterestAreas.forEach(function (area) {
        if (areas.match(area + ',')) {
          containsArea = true;
        }
      });
    } else {
      console.log('Esta usando TODAS as Àreas');
      containsArea = true;
    }

    if (! containsArea) {
      return false;
    }
    console.log('VAI NOTIFICAR');
    
    var alert_activity = $('.alert_activity_flow_count').html() * 1;
    $('#tab-flow a span').addClass('badge');
    $('#tab-flow a span').html(alert_activity + 1);
    if ($('#tab-business').hasClass('active')) {
      localStorage.setItem("timeline-flow", alert_activity + 1);
    }
    
    if (alert_activity == 0) {
      var complement = ' nova atualização';
    } else {
      var complement = ' novas atualizações';
    }
    $('.alert_activity_flow').fadeIn();
    $('.alert_activity_flow_count').html(alert_activity + 1);
    $('.alert_activity_flow_text').html(complement);

  });

});