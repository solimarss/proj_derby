var socket;
var lazyload = '';
var media_server;

var hashtagList = [];
var relatedHashtags = [];

// PEGAR TAMANHO DA IMAGEM EM JAVASCRIPT 
//http://stackoverflow.com/questions/623172/how-to-get-image-size-height-width-using-javascript

$(document).ready(function() {

  $('.select2').select2();

  $(".link-popover").popover({
       html : true
   });
  
  $(document).on('submit','#adduser-form',function(){
    var $form = $(this);
    $('#submit',$form).val('Cadastrando...').addClass('disabled').attr('disabled',true);
    $.ajax({
      url: $form.attr('action'),
      type: 'post',
      dataType: 'json',
      async: true,
      data: $form.serialize(),
      success: function (response) {
        console.log('Usuário cadastrado com sucesso',response);
        showAlertGeneral('success',response.message,'#adduser-message');
        $('#reset',$form).click();
      },
      error: function (response) {
        console.log('Erro ao cadastrar usuário',response.responseText);
        data = JSON.parse(response.responseText);
        showAlertGeneral('danger',data.message,'#adduser-message');
      },
      complete: function(){
        console.log('Requisição cadastro completa');
        $('#submit',$form).val('Salvar').removeClass('disabled').attr('disabled',false);
      }
    });

    return false;
  })
  if ($('.ckeditor').length) {
    CKEDITOR.on('instanceReady', function(ev) {
      var tags = ['p', 'ol', 'ul', 'li']; // etc.

      for (var key in tags) {
        ev.editor.dataProcessor.writer.setRules(tags[key],
                {
                  indent: false,
                  breakBeforeOpen: true,
                  breakAfterOpen: false,
                  breakBeforeClose: false,
                  breakAfterClose: true
                });
      }
    });
  }
  $('body').on('click', '.cke_dialog a[title="Enviar"], .cke_dialog a[title="Upload"]', function() {
    $('.cke_dialog div[name="Upload"] table').hide();
    if (!$("#formFilePostCke").length) {
      $('.cke_dialog div[name="Upload"]').append('<form id="formFilePostCke" method="post" action="/upload" >' +
              '<label> Upload de Imagens <br/>' +
              '<input type="file" id="uploadImageCkEditor" name="uploadImageCkEditor" class="btn btn-mini btn-info"/></label>' +
              '</form><br/><center><div id="messageWaitLoading" style="display: none; font-size: 14px;">' +
              '<img src="/img/loading.gif" style="margin-left: 180px;"><p>' +
              '<strong style="margin-left: 115px;">Carregando a imagem, aguarde...</strong></p></div></center>');
    }
  });
  $('#formFilePostCke').livequery(function() {
    $('#formFilePostCke').ajaxForm({
      type: 'post',
      dataType: 'json',
      data: {
        entity_id: portal.entity_id,
        status: 'waiting'
      },
      success: function(responseText) {
        $("#messageWaitLoading").livequery(function() {
          $("#messageWaitLoading").hide();
        });
        var dialog = CKEDITOR.dialog.getCurrent();
        dialog.setValueOf('info', 'txtUrl', responseText.url);
        dialog.selectPage('info');
        var medias = $('input#media_in_text').val();
        if (medias != '' && typeof medias != 'undefined') {
          medias = JSON.parse(medias);
        } else {
          medias = [];
        }
        medias.push(responseText);
        $('input#media_in_text').val(JSON.stringify(medias));
      },
      error: function(response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('error', response.message);
        } catch (exception) {
          return false;
        }
      },
      complete: function() {
        $('#formFilePostCke img#loadingImagePostCke').remove();
      }
    });
  });
  $("body").on("change", "#uploadImageCkEditor", function() {
    $("#messageWaitLoading").livequery(function() {
      $("#messageWaitLoading").fadeIn();
    });
    $('#formFilePostCke').trigger('submit');
  });
  //FIM CKEDITOR

  //Faz apresentação do higlite code nos posts
  hljs.initHighlightingOnLoad();
  $('.post-text-in pre:has(code)').addClass("pre-highlightcode");
  //--

  //ICON DO NUMERO DE NOTIFICAÇÕES NA ABA DO NAVEGADOR
  Tinycon.setOptions({
    width: 6,
    height: 9,
    font: '9px arial',
    fallback: true
  });
  //GAMBIARRA PARA DEIXAR IMAGEN DE POSTS ANTIGOS NO CENTRO
  var $img = $('.layout-old p[style*="justify"] img:first');
  if ($img.length) {
    $img.wrap('<div style="display:block;margin:0 auto;width:100%;height:' + $('.layout-old img:first').height() + 'px"></div>');
    $img.css({'position': 'absolute', 'left': '0', 'right': '0', 'margin': '0 auto'});
    $img.height('auto');
  }


  $('html').on('click', function() {
    $('#form-search-general .autocomplete').hide();
  });
  $('#form-search-general .autocomplete a,#input_busca').click(function(e) {
    e.stopPropagation();
  });
  $('#input_busca').focus(function() {
    var value = $(this).val(), $form = $(this).closest('form');
    if (!value) {

      // BUSCA E ARMAZENAMENTO DOS USUARIOS DO AUTOCOMPLETE
      var searchClicked = localStorage.getItem("search-clicked");
      if (searchClicked) {
        searchClicked = JSON.parse(searchClicked);
        //tratamento para que imagens armazenadas no localStorage já bugadas sejam apresentadas corretamente,
        //com o tempo esse each pode ser removido
        $.each(searchClicked, function(i, reg){
          if (reg.image == "null") {
            reg.image = reg.type === "user" ? "https://ciranda.me/img/no-image-user.jpg" : "https://ciranda.me/img/no-image.jpg";
          } else {
            reg.image = reg.image.replace('ciranda.me//', 'ciranda.me/');
          }
        });
        
        $('.autocomplete ul', $form).html($.tmpl("<li class='search-clicked'><img class='img-circle atwho-image' src='${avatar(image)}'/><a href='${searchListUrl(slug,result_type,domain)}'>${name}<br/><small>${result_type}</small></a></li>", searchClicked))
        $('.autocomplete', $form).show();
        $('.autocomplete', $form).css('max-height', $(window).height() - 50);
      }
    }
  });
  $('#input_busca').keyup(function() {
    var value = $(this).val(), $form = $(this).closest('form');
    if (!value) {
      $('.autocomplete', $form).show();
    } else {
      $('.autocomplete', $form).hide();
    }
  });

  var cachequeryMentions = [], itemsMentions;
  $('#input_busca').atwho({
    at: "",
    data: '/search/autocomplete/initial/1',
    callbacks: {
      matcher: function(flag, subtext) {
        var match, regexp;
        regexp = new XRegExp('^([A-Za-z0-9]\\p{L}+(?:\\s(?:[A-Za-z0-9]\\p{L}*))*)$', 'g');
        match = regexp.exec(subtext);
        if (match) {
          input = match.input;
          return match[1];
        } else {
          return null;
        }
      },
      remote_filter: function(query, render_view) {
        var thisVal = query,
                self = $(this);
        if (!self.data('active') && thisVal.length >= 2) {
          self.data('active', true);
          itemsMentions = cachequeryMentions[thisVal];
          if (typeof itemsMentions == "object") {
            render_view(itemsMentions);
          } else {
            if (self.xhr) {
              self.xhr.abort();
            }
            self.xhr = $.ajax({
              url: '/search/autocomplete',
              type: 'POST',
              dataType: 'json',
              data: {search: query},
              success: function(response) {
                cachequeryMentions[thisVal] = response.data
                self.data('active', false);
                render_view(response.data);
              },
              error: function(response) {
                return showResponseError(response, null, {
                  subject: 'Erro ao buscar autocomplete (mentions)',
                  search: query
                });
              }
            });
          }
        }
      },
      before_insert: function(value, $li) {
        var clicked = {
          id: $li.data('id'),
          name: $li.data('name'),
          image: $('img', $li).attr('src'),
          type: $li.data('type'),
          result_type: $li.data('result_type'),
          slug: $li.data('slug'),
          domain: $li.data('domain')
        };
        var searchClicked = localStorage.getItem("search-clicked");
        if (searchClicked) {
          searchClicked = JSON.parse(searchClicked);

          // iterate over each element in the array
          for (var i = 0; i < searchClicked.length; i++) {
            // look for the entry with a matching `code` value
            if (searchClicked[i].slug === $li.data('slug') && searchClicked[i].type === $li.data('type')) {
              searchClicked.splice(i, 1);
            }
          }

          searchClicked.unshift(clicked);

          if (searchClicked.length === 11) {
            searchClicked.pop();
          }
        } else {
          searchClicked = [clicked];
        }
        localStorage.setItem("search-clicked", JSON.stringify(searchClicked));
        document.location = searchListUrl($li.data('slug'), $li.data('result_type'), $li.data('domain'));
        return value;
      },
      tpl_eval: function(tpl, map) {
//          return $.tmpl(tpl,map);
//        console.log(map);
        var error;
        try {
          return tpl.replace(/\$\{([^\}]*)\}/g, function(tag, key, pos) {
            if (key === 'image') {
              return avatar(map['image']);
            } else {
              return map[key];
            }
          });
        } catch (_error) {
          error = _error;
          return "";
        }
      }
      //, ... others callbacks
    },
    tpl: "<li class='atwho-search-list' data-id='${id}' data-name='${name}' data-type='${type}' data-result_type='${result_type}' data-slug='${slug}' data-domain='${domain}' data-value='${name}'><img class='img-circle atwho-image' src='${image}' /><span>${name}<br/><small>${result_type}</small></span></li>"
  });


  // REMOVE AS IMAGENS DA PAGINA PARA TESTES QUE NÂO PRECISÂO DELA PQ È UM SACO ESPERAR O CARREGAMENTO FICA A DICA
  //  $('img').removeAttr('src');

  $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox();
  });
  
  //TRATAMENTO DE LISTAGEM DE ATIVIDADES COm REDIMENSIONAMENTO DE JANELA
  $(window).on('resize', function() {
    if ($(window).width() < 975) {
      umaColuna();
    }
    if ($(window).width() >= 975) {
      createWookmark();
    }
  });
  
  //TRATAMENTO DE LISTAGEM DE ATIVIDADES
  createWookmark();
  $('.dotdotdot').dotdotdot();
  $(document).on('click', '.truncate .readmore', function() {
    var parent = $(this).parent();
    var content = $(parent).triggerHandler("originalContent");
    $(parent).removeClass('truncate');
    $(parent).html('');
    $(parent).append(content);
    refreshWookmark();
  });

  updateMediaPreview();

  $(document).on('change', '.truncate', function() {
    $(this).dotdotdot({
      after: 'a.readmore'
    });
  });
  $('.date_time').livequery(function() {
    $(this).timeago();
    $(this).show();
  });

  $("#sidebar-fixed").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
    $("#wrapper").toggleClass("mobile-toggled");
  });

  // FIM SIDEBAR

  // UPLOAD DE CAPA
  $('.cover-link-edit').popover();
  $('.cover-edit').on('click', function() {
    $parent = $('#container-cover-fluid');
    $form = $("<form enctype='multipart/form-data'></form>");
    data = {status: 'published'};
    data.type = $(this).data('type');
    data.id = $(this).data('id');
    $input_file = $('<input type="file" name="file" value=""/>');
    $input_file.click();
    $form.ajaxForm({
      url: '/upload/cover',
      type: 'post',
      dataType: 'json',
      data: data,
      beforeSend: function() {
        $('.ciranda-loading', $parent).show();
      },
      success: function(responseText, statusText, xhr, $form) {
        $('.cover-image', $parent).remove();
        $img = $('<img class="cover-image" src="' + responseText.data.url + '" />');
        $parent.append($img);
        $img.load(function() {
          if ($(this).width() <= 1138) {
            $(this).wrap('<div class="container"></div>');
          }
          $(this).width('100%');
        })
        $img.show();
        $('.cover-link-edit').show();
      },
      error: function(xhr, statusText, error) {
        try {
          var json = $.parseJSON(xhr.responseText);
          showAlertGeneral('danger', json.message);
        } catch (e) {
          showAlertGeneral('danger', 'Ocorreu um erro inesperado. O mesmo será corrigido o mais rápido possível, tente novamente mais tarde.')
        }
      },
      complete: function(xhr) {
        $('.ciranda-loading', $parent).hide();
      }
    });
    $input_file.change(function() {
      $form.append($input_file);
      $form.trigger('submit');
    });
  });
  $(document).on('submit', '.cover-link-form', function(e) {
    e.preventDefault();
    var link = $('input[name="link"]', $(this)).val();
    if (!link) {
      showAlertGeneral('danger', 'Preencha o campo link');
    }

    var data = {
      link: link,
      type: $(this).data('type'),
      id: $(this).data('id')
    }
//    console.log(data);
    $.ajax({
      url: '/upload/cover',
      type: 'POST',
      data: data,
      dataType: 'json',
      success: function(response) {
        if ($('.cover-image').parent().is('a')) {
          $('.cover-image').parent().attr('href', link);
        } else {
          $('.cover-image').wrap('<a href="' + link + '" target="blank"></a>');
        }
        $('.cover-link-edit').popover('hide');
        showAlertGeneral('success', 'Link salvo com sucesso');
      },
      error: function(response) {
        showResponseError(response, null, {
          subject: 'Erro ao efetuar upload da capa',
          rota: '/upload/cover',
          data: data
        });
      }
    });
    return false;
  });
  //FIM FORMULARIO DE UPLOAD DE CAPA


  // FORMULÀRIOS DE ATIVIDADES 
  if (typeof (Storage) == "undefined") {
    showAlertGeneral('warning', 'Seu navegador é antigo e não suporta alguns recursos :(');
  }

  // BUSCA E ARMAZENAMENTO DOS USUARIOS DO AUTOCOMPLETE
  var usersFollow, usersFollowDate;
  usersFollow = localStorage.getItem("users-follow");
  usersFollowDate = localStorage.getItem("users-follow-date");
  if(user){
    if (!usersFollow || !usersFollowDate || new Date() > new Date(JSON.parse(usersFollowDate))) {
      $.ajax({
        url: '/profiles/followings',
        type: 'POST',
        dataType: 'json',
        success: function(response) {
          localStorage.setItem("users-follow", JSON.stringify(response));
          var amanha = new Date();
          amanha.setDate(amanha.getDate() + 1);
          localStorage.setItem("users-follow-date", JSON.stringify(amanha));
          usersFollow = response;
        },
        error: function(response) {
  //        return showResponseError(response);
        }
      });
    } else {
      usersFollow = JSON.parse(usersFollow)
    }
  }

  // BUSCA E ARMAZENAMENTO DAS HASHTAGS DO AUTOCOMPLETE
  var hashtags, hashtagsDate;
//  hashtags = localStorage.getItem("hashtags");
//  hashtagsDate = localStorage.getItem("hashtags-date");
//  if (!hashtags || !hashtagsDate || new Date() > new Date(JSON.parse(hashtagsDate))) {
  if(user){
    $.ajax({
      url: '/activity/hashtags',
      type: 'POST',
      dataType: 'json',
      success: function(response) {
        var amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        var hash_list = $.map(response, function(value, i) {
          return {'id': i, 'name': value};
        });
  //        localStorage.setItem("hashtags", JSON.stringify(hash_list));
  //        localStorage.setItem("hashtags-date", JSON.stringify(amanha));
        hashtags = hash_list;
      },
      error: function(response) {
  //        return showResponseError(response);
      }
    });
  }
//  } else {
//    hashtags = JSON.parse(hashtags);
//  }

  // AUTOCOMPLETE DE USUÀRIOS E HASHTAGS

  // VARIAVEIS GLOBAIS AUTOCOMPLETE DE USUARIOS E HASHTAGS
  var mention, activityHash, input, atwhoVisible = false;
  // Funções do autocomplete de usuários e hashtags em atividades

  var atwhoMatcher = function(flag, subtext, should_start_with_space) {
    var match, regexp;
    input = subtext;
    flag = flag.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    if (should_start_with_space) {
      flag = '(?:^|\\s)' + flag;
    }
    regexp = new RegExp(flag + '([A-Za-zÀ-ÿ0-9_\+\-]*)$|' + flag + '([^\\x00-\\xff]*)$', 'gi');
    match = regexp.exec(subtext);
    if (match) {
      return match[2] || match[1];
    } else {
      return null;
    }
  };

  var atwhoBeforeInsert = function(value, $li) {
    mention = {id: $li.attr('data-id'), username: $li.attr('data-username'), name: value};
    return value;
  };

  var atwhoInsertingWrapper = function($inputor, content, suffix) {
    var $form = $inputor.closest("form");
    var mentions = $('.input-mentions', $form).val();
    if (mentions) {
      mentions = JSON.parse(mentions);
      mentions.push(mention);
    } else {
      mentions = [mention];
    }
    $('.input-mentions', $form).val(JSON.stringify(mentions));
    var new_suffix;
    new_suffix = suffix === "" ? suffix : suffix || " ";
    if ($inputor.is('textarea, input')) {
      return '' + content + new_suffix;
    }
  };
// FIM das Funções do autocomplete de usuários e hashtags em atividades

  // AUTOCOMPLETE DE USUARIOS E HASHTAGS
  $(document).on('focus', '.atwho-value', function() {
    $(this).atwho({
      at: '',
      suffix: '  ',
      callbacks: {
        matcher: function(flag, subtext) {
          var match, regexp;
          regexp = new XRegExp('(?:\\s+|^)([A-Z]\\p{L}+(?:\\s(?:[A-Z]\\p{L}*))*)$', 'g');
          match = regexp.exec(subtext);
          if (match) {
            input = match.input;
            return match[1];
          } else {
            return null;
          }
        },
        filter: function(query, data, search_key) {
          var item, item_search, regx, _i, _len, _results;
          _results = [];
          regx = new RegExp('^' + query.toLowerCase() + '.*', 'g');
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            item = data[_i];
            item_search = new String(item[search_key]).toLowerCase();
            if (regx.test(item_search)
                    && (new String(item[search_key]).length > input.length || input.toLowerCase().indexOf(new String(item[search_key]).toLowerCase()) == -1)) {
              _results.push(item);
            }
          }
          return _results;
        },
        before_insert: atwhoBeforeInsert,
        inserting_wrapper: atwhoInsertingWrapper
      },
      search_key: "name",
      tpl: "<li data-id='${id}' data-username='${username}' data-name='${name}' data-value='${name}'><img class='img-circle atwho-image' src='${avatar}'/> ${name}</li>",
      data: usersFollow
    }).atwho({
      at: "@",
      search_key: "username",
      tpl: "<li data-id='${id}' data-username='${username}' data-name='${name}' data-value='${atwho-at}${username}'><img class='img-circle atwho-image' src='${avatar}'/> ${name}</li>",
      data: usersFollow,
      callbacks: {
        matcher: atwhoMatcher,
        filter: function(query, data, search_key) {
          var item, item_search, regx, _i, _len, _results;
          _results = [];
          regx = new RegExp('^' + query.toLowerCase() + '.*', 'g');
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            item = data[_i];
            item_search = new String(item[search_key]).toLowerCase();
            if (regx.test(item_search)
                    && (new String(item[search_key]).length > input.length || input.toLowerCase().indexOf('@' + new String(item[search_key]).toLowerCase()) == -1)) {
              _results.push(item);
            }
          }
          return _results;
        },
        before_insert: atwhoBeforeInsert,
        inserting_wrapper: atwhoInsertingWrapper
      }
    }).atwho({
      at: "#",
      search_key: "name",
      tpl: "<li data-id='${id}' data-value='${atwho-at}${name}'>${atwho-at}${name}</li>",
      data: hashtags,
      callbacks: {
        matcher: atwhoMatcher,
        filter: function(query, data, search_key) {
          var item, item_search, regx, _i, _len, _results;
          _results = [];
          regx = new RegExp('^' + query.toLowerCase() + '.*', 'g');
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            item = data[_i];
            item_search = new String(item[search_key]).toLowerCase();
            if (regx.test(item_search)
                    && (new String(item[search_key]).length > input.length || input.toLowerCase().indexOf('#' + new String(item[search_key]).toLowerCase()) == -1)) {
              _results.push(item);
            }
          }
          return _results;
        },
        inserting_wrapper: function($inputor, content, suffix) {
          var $form = $inputor.closest("form");
          var activityHashs = $('.input-hashtags', $form).val();
          if (activityHashs) {
            $('.input-hashtags', $form).val(activityHashs += (',' + content.substr(1)));
          } else {
            $('.input-hashtags', $form).val(content.substr(1));
          }
          var new_suffix;
          new_suffix = suffix === "" ? suffix : suffix || " ";
          if ($inputor.is('textarea, input')) {
            return '' + content + new_suffix;
          }
        }
      }
    }).on("shown.atwho", function(event) {
      atwhoVisible = true;
    }).on("hidden.atwho", function(event) {
      atwhoVisible = false;
    });
  });
  // FIM DE AUTOCOMPLETE DE USUARIOS E HASHTAGS


  // BOTAO DE ESCOLHA DE BLOG PARA POSTAGEM
  $('.blog-list-button a').click(function() {
    $('.blog-selected span').html($(this).find('.blog-title').html());
    $('#form-activity .activity-blog').val($(this).attr('data-id'));
    if ($(this).attr('data-notify')) {
      $('#form-activity .notify-members').show();
    } else {
      $('#form-activity .notify-members').hide();
    }
  })

  $('.blog-default-check').click(function() {
    var $parent = $(this).parent();
    var $default = $(this);
    $.ajax({
      url: '/profiles/blogdefault',
      type: 'POST',
      data: {blog: $parent.data('id')},
      dataType: 'json',
      success: function(responseText) {
        $parent.click();
        $('.blog-default-check').removeClass('default');
        $default.addClass('default');
        $('.blog-selected').removeAttr('disabled');
      },
      error: function(responseText) {
        showResponseError(responseText, null, {
          subject: 'Erro ao alterar blog default',
          rota: '/profiles/blogdefault',
          data: {blog: $parent.data('id')}
        });
      }
    });
    return false;
  })


  // NAVEGAÇÂO ENTRE FORMULARIOS DE ATIVIDADE
  $('.form-activity-nav a').click(function() {

    $('.form-activity-nav li').removeClass('active');
    $(this).parent().addClass('active');
    $('#form-activity form').slideUp(200);
    $($(this).attr('href')).slideDown(200);
    return false;
  });
  // ADIÇÂO DE NOVA OPÇÂO EM ENQUETE
  $('.poll-add-option').click(function() {
    var $form = $(this).closest('form');
    var $option = $('<div class="form-group form-poll-option"><input type="text" name="answers[]" class="poll-answers form-control" placeholder="Outra opção"/></div>');
    var empty = false;
    $('.poll-answers', $form).each(function() {
      if (!$(this).val()) {
        showAlertGeneral('warning', 'Ainda existem opções vazias');
        empty = true;
      }
    })
    if (empty) {
      return false;
    }

    $option.insertAfter('.form-poll-option:last', $form);
  })

  // FORMULÀRIO DE CADASTRO DE ATIVIDADE
  $('#form-activity form.form-activity').submit(function() {
    $form = $(this);
    if (!$('.activity-value', $form).val() && !$('.input-medias', $form).val()) {
      showAlertGeneral('danger', 'Atividade precisa de conteúdo ou de media para ser públicada');
      return false;
    }

    if (($('.input-type', $form).val() == 'ask' || $('.input-type', $form).val() == 'poll') && !$('.input-title', $form).val()) {
      showAlertGeneral('danger', 'Atividades deste tipo precisão de título');
      return false;
    }

    var action = '/activity/add';
    if ($('.input-type', $form).val() == 'poll') {
      action = '/stack/add';
    }

    var data = $form.serializeArray();
    var buttonText = $('#form-activity button.btn.blog-selected').html();
    data.push({name: 'timeline', value: 1});
    $.ajax({
      url: action,
      type: 'POST',
      data: data,
      dataType: 'json',
      beforeSend: function() {
        $('#form-activity button.btn.blog-selected').addClass('disabled');
        $('#form-activity button.btn.blog-selected').html('Publicando...');
      },
      success: function(response) {
        var $activity = $(response.data.html_activity);
        $activity.removeClass(function(index, css) {
          return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
        });
        $activity.width('100%');
        $activity.insertAfter('#timeline .timeline-forms');
        $('.activity-media-gallery', $activity).slick({
          dots: true
        });
        // LIMPAR FORMULÀRIO DE ATIVIDADE (SIM È ESSE PARTO MESMO)
        $form[0].reset();
        $('.input-medias', $form).val('');
        if (!$('.input-value', $form).hasClass('parse-link') && !$('.input-value', $form).hasClass('poll-description')) {
          $('.input-value', $form).addClass('parse-link');
        }
        $('.form-activity-file').show();
        $('.upload-preview .preview,.upload-preview .preview-file div,.previewMedia', $form).html('');
        $('.upload-preview .preview,.upload-preview .preview-file,.previewMedia', $form).hide().unslick();
        var options = 0;
        $('.form-poll-option').each(function() {
          options++;
          if (options > 2) {
            $(this).remove();
          }
        });
        if ($('.input-value', $form).hasClass('parse-link')) {
          $('.input-value', $form).attr('placeholder', $('.input-value', $form).attr('data-placeholder'));
        }
        // FIM LIMPAR FORMULARIOS

        // ISSO PRECISA VIRAR FUNÇÂO
        if ($('.poll-status', $activity).length) {
          $('.poll-status', $activity).progressbar({
            create: function(event, ui) {
              var $poll_id = $(this).parent().parent().find('input').attr('id').split('_')[1];
              var total = parseInt($('#' + $poll_id + '_answers_count').html());
              var status = (parseInt($(this).attr('title'), 10) * 100 / total);
              $(this).progressbar('option', 'value', status);
              $(this).css('height', $(this).parent().css('height') + 1);
            }
          });
        }
        if (response.flow) {
          socket.emit('broadcast', 'flow updated', response.interest_areas);
        } else {
          socket.emit('timeline updated');
        }

        if (!response.credits_email && response.credits_email == false) {
          showAlertGeneral('warning', 'Créditos insuficientes para  enviar a atividade por email.<br/><a href="/' + portal.entity_slug + '/premium/campaignsemail" title="Comprar créditos">Comprar créditos</a>', undefined, true);
        }

        updateMediaPreview();
        populateAvaliableInterestAreaActivity();
      },
      error: function(response) {
        return showResponseError(response, null, {
          subject: 'Erro ao cadastrar atividade',
          rota: action,
          data: data
        });
      },
      complete: function() {
        $('#form-activity button.btn.blog-selected').removeClass('disabled');
        $('#form-activity button.btn.blog-selected').html(buttonText);
      }
    });
    return false;
  });

  // EDITAR ATIVIDADE

  $(document).on('submit', '.form-activity-edit', function(event) {
    event.preventDefault();
    var $form = $(this);

    var data = {
      id: $form.data('id'),
      value: $('textarea', $form).val(),
      title: $('input[name="title"]', $form).val(),
      mentions: $('input[name="mentions"]', $form).val()
    };

    $.ajax({
      url: '/activity/add',
      type: 'POST',
      data: data,
      dataType: 'json',
      success: function(response) {
        $('#activity-text-' + data.id).html($('#activity-text-' + data.id, response.data.html_activity).html());
        $('#activity-text-' + data.id).removeClass('hidden');
        $('#activity-edit-' + data.id).addClass('hidden');
      },
      error: function(response) {
        return showResponseError(response, null, {
          subject: 'Erro ao editar atividade',
          rota: '/activity/add',
          data: data
        });
      }
    });
  });

  // FIM EDITAR ATIVIDADE

  // ANEXO DE ATIVIDADES*/

  var templates = {};
  templates.image = '<div class="row"><div class="col-lg-12 col-md-12 col-sm-12 col-xs-12"><img src="${url}"/></div></div>';
  templates.file = '<a href="${url}" class="file-activity" target="_blank"><p class="title"><img src="${thumb}" alt="${thumb}"/>${title}</p></a>';
//  templates.file = '<div class="row"><div class="col-lg-4 col-md-4 col-sm-12 col-xs-12"><img src="${thumb}"/></div><div class="col-lg-8 col-md-8 col-sm-12 col-xs-12"><h3>${title}</h3><span>${bytesToSize(size)}</span></div></div>';

  $(document).on('click', '.form-activity-file', function() {
    $parent_form = $(this).closest('form');
    $form = $("<form enctype='multipart/form-data'></form>");
    $input_file = $('<input type="file" name="file" value=""/>');
    $input_file.click();
    var $progress_bar = $('.progress-bar', $parent_form);
    $form.ajaxForm({
      url: '/upload',
      type: 'post',
      dataType: 'json',
      data: {status: 'waiting'},
      beforeSend: function() {
        $('.ciranda-loading', $parent_form).show();
        $('.progress', $parent_form).slideDown(500);
        var percentVal = '0';
        $progress_bar.attr('aria-valuenow', percentVal);
        $progress_bar.width(percentVal + '%');
        $progress_bar.html(percentVal + '%');
      },
      uploadProgress: function(event, position, total, percentComplete) {
        var percentVal = percentComplete;
        $progress_bar.attr('aria-valuenow', percentVal);
        $progress_bar.width(percentVal + '%');
        $progress_bar.html('Enviando ' + percentVal + '%');
        if (percentVal == 100) {
          $('.progress', $parent_form).slideUp(500);
        }
      },
      success: function(responseText, statusText, xhr, $form) {
        var medias = $('.input-medias', $parent_form).val();
        if (medias) {
          medias = JSON.parse(medias);
          medias.push(responseText);
        } else {
          medias = [responseText];
        }

        if (responseText.kind == 'image') {
          if ($('.preview', $parent_form).hasClass('slick-initialized')) {
            $('.preview', $parent_form).slickAdd($.tmpl(templates[responseText.kind], responseText));
            $('.preview', $parent_form).slickGoTo(medias.length - 1);
          } else {
            $.tmpl(templates[responseText.kind], responseText).appendTo('.preview', $parent_form);
            $('.preview', $parent_form).show();
            $('.preview', $parent_form).slick({dots: true, arrows: false});
          }
        }

        if (responseText.kind == 'file') {
          $('.preview-file div', $parent_form).append($.tmpl(templates[responseText.kind], responseText));
          $('.preview-file', $parent_form).show(500);
        }

        $('.input-medias', $parent_form).val(JSON.stringify(medias));
        $('.parse-link', $parent_form).removeClass('parse-link');
      },
      error: function(response) {
        showResponseError(response, null, {
          subject: 'Erro ao anexar arquivo na atividade',
          rota: '/upload',
          data: $form.serializeArray()
        });
      },
      complete: function(xhr) {
        $('.ciranda-loading', $parent_form).hide();
        $('.progress', $parent_form).slideUp(500);
      }
    });
    $input_file.change(function() {
      $form.append($input_file);
      $form.trigger('submit');
    });
  });

  $(document).on('click', '.upload-file', function(e) {
    e.preventDefault();

    $object = $(this);
    $parent_form = $(this).closest('form');
    $form = $("<form enctype='multipart/form-data'></form>");
    $input_file = $('<input type="file" name="file" value=""/>');
    $input_file.click();

    if ($('.upload-preview', $parent_form).length) {
      $('.upload-preview', $parent_form).html($('<div class="ciranda-loading" style="display:none"></div>'));
      $('.upload-preview', $parent_form).append($('<div class="progress" style="display: none"><div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>'));
      var $progress_bar = $('.progress-bar', $parent_form);
    }
    var data = $object.data();
    data.status = 'waiting';

    $form.ajaxForm({
      url: '/upload/general',
      type: 'post',
      dataType: 'json',
      data: data,
      beforeSend: function() {
        if ($('.upload-preview', $parent_form).length) {
          $('.ciranda-loading', $parent_form).show();
          $('.progress', $parent_form).slideDown(500);
          var percentVal = '0';
          $progress_bar.attr('aria-valuenow', percentVal);
          $progress_bar.width(percentVal + '%');
          $progress_bar.html(percentVal + '%');
        }
      },
      uploadProgress: function(event, position, total, percentComplete) {
        if ($('.upload-preview', $parent_form).length) {
          var percentVal = percentComplete;
          $progress_bar.attr('aria-valuenow', percentVal);
          $progress_bar.width(percentVal + '%');
          $progress_bar.html('Enviando ' + percentVal + '%');
          if (percentVal == 100) {
            $('.progress', $parent_form).slideUp(500);
          }
        }
      },
      success: function(responseText, statusText, xhr, $form) {
        if ($object.data('multi')) {
          var medias = $('input[name="upload_files"]', $parent_form).length ? $('.upload-files', $parent_form).val() : null;
          if (medias) {
            medias = JSON.parse(medias);
            medias.push(responseText.data);
          } else {
            medias = [responseText.data];
          }
        } else {
          medias = responseText.data;
        }

        if ($object.data('multi')) {
          $.tmpl(templates[responseText.data.kind], responseText.data).appendTo('.upload-preview', $parent_form);
        } else {
          $('.upload-preview', $parent_form).html($.tmpl(templates[responseText.data.kind], responseText.data));
        }
        $('.upload-preview', $parent_form).show();

        if ($('input[name="upload_files"]', $parent_form).length) {
          $('input[name="upload_files"]', $parent_form).val(JSON.stringify(medias));
        } else {
          $parent_form.append("<input type='hidden' name='upload_files' class='upload-files' value='" + JSON.stringify(medias) + "'/>")
        }
      },
      error: function(xhr, statusText, error) {
        try {
          var json = $.parseJSON(xhr.responseText);
          showAlertGeneral('danger', json.message);
        } catch (e) {
          showAlertGeneral('danger', 'Ocorreu um erro inesperado. O mesmo será corrigido o mais rápido possível, tente novamente mais tarde.')
        }
      },
      complete: function(xhr) {
        $('.ciranda-loading', $parent_form).hide();
        $('.progress', $parent_form).slideUp(500);
      }
    });

    $input_file.change(function() {
      $form.append($input_file);
      $form.trigger('submit');
    });

  });
  //FIM FORMULARIO DE ATIVIDADE


  // FORMULÁRIO DE COMENTÀRIO
  $(document).on('submit', '.form-comment-add', function(event) {
    event.preventDefault();
    $form = $(this);
    if (!$('.input-value', $form).val() && !$('.input-medias', $form).val()) {
      showAlertGeneral('danger', 'Comentário precisa de texto ou media para ser cadastrado');
      return false;
    }

    var commentData = {};
    $.each($form.serializeArray(), function() {
      commentData[this.name] = this.value;
    });
    $.ajax({
      url: '/activity/comment',
      type: 'POST',
      data: $form.serializeArray(),
      dataType: 'json',
      beforeSend: function() {
        $form.hide();
        $form.parent().find('.comment-loading').show();
      },
      complete: function() {
        $form.parent().find('.comment-loading').hide();
        $form.show();
      },
      success: function(response) {
        var data = response.html;
        var activity_id = commentData.activity_id;
        var htmlSocket = '<div>' + data + '</div>';
        var $commentHtml = $(htmlSocket);
        $commentHtml.find('.post-controls').remove();
        if (!commentData.comment_id) {
          var viewType = $form.attr('id').split('_')[0];
          if ($form.hasClass('form-comment-add-post')) {
            $(data).hide().prependTo($('#container-activity-' + activity_id + ' .comments')).fadeIn(500);
          } else {
            $(data).hide().appendTo($('#container-activity-' + activity_id + ' .comments')).fadeIn(500);
          }
          var _post_comments_count = $('#' + activity_id + '_comments_count');
          var count = parseInt(_post_comments_count.html()) + 1;
          if (!count) {
            count = 1;
          }

          var _post_likes_count = $('#' + activity_id + '_likes_count');
          var likes_count = parseInt(_post_likes_count.html());
          var plural = ((count > 1) || (count == 0)) ? ' comentaram' : ' comentou';
          if (likes_count > 0)
            $('#' + activity_id + '_post_e').fadeIn();
          _post_comments_count.html(count + plural).show('slow');
        } else if (commentData.comment_id) {
          $(data).hide().appendTo($('#comment_' + commentData.comment_id + ' .subcomments').first()).fadeIn(500);
        } else if ($(data).attr('class').split('-', 1) == 'message') {
          $form.parent().prepend($(data).slideDown(500));
        }

        $('#' + $(data).attr('id') + ' .activity-media-gallery').slick({
          dots: true
        });
        // LIMPAR FORMULARIO
        $('.input-value', $form).val('');
        $('.input-mentions', $form).val('');
        $('.input-hashtags', $form).val('');
        $('.input-medias', $form).val('');
        if (!$('.input-value', $form).hasClass('parse-link')) {
          $('.input-value', $form).addClass('parse-link');
        }
        $('.form-activity-file', $form).show();
        $('.upload-preview .preview,.upload-preview .preview-file div,.previewMedia', $form).html('');
        $('.upload-preview .preview,.upload-preview .preview-file,.previewMedia', $form).hide().unslick();

        $('.input-value', $form).attr('placeholder', 'Insira seu comentário...');
        // FIM LIMPAR FORMULARIO

        socket.emit('broadcast', 'new comment', viewType, activity_id, $commentHtml.html());

        if (response.flow) {
          socket.emit('broadcast', 'flow updated', response.interest_areas);
        } else {
          socket.emit('timeline updated');
        }

        try {
          postSize();
        } catch (exception) {
        }
        refreshWookmark();
        updateMediaPreview();
      },
      error: function(response) {
        return showResponseError(response, null, {
          subject: 'Erro ao cadastrar comentário',
          rota: '/activity/comment',
          data: $form.serializeArray()
        });
      }
    });
    return false;
  });

  $(document).on('submit', '.form-comment-edit', function(event) {
    event.preventDefault();
    var $form = $(this);

    var data = {
      id: $form.data('id'),
      activity_id: $form.data('activity'),
      value: $('textarea', $form).val(),
      mentions: $('input', $form).val()
    };

    $.ajax({
      url: '/activity/comment',
      type: 'POST',
      data: data,
      dataType: 'json',
      success: function(response) {
        $('#comment-text-' + data.id).html($('#comment-text-' + data.id, response.html).html());
        $('#comment-text-' + data.id).removeClass('hidden');
        $('#comment-edit-' + data.id).addClass('hidden');
      },
      error: function(response) {
        return showResponseError(response, null, {
          subject: 'Erro ao editar comentário',
          rota: '/activity/comment',
          data: data
        });
      }
    });
  });
  // FIM FORMULÀRIO DE COMENTÀRIO

  // ATIVIDADES

  // gareria de media nas atividades
  $('.activity-media-gallery').slick({
    dots: true
  });
  //TRUNCATE DE ATIVIDADES
  truncateActivity();
  // Tratamento em comentário e atividade para publicação com enter
  // Submit comment com enter e shift + enter para pular linha
  $('#ciranda-content').on('keypress', '.textarea-reply,.textarea-message-user-width-enter', function(e) {
    var obj = $(this);
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey && !atwhoVisible) {
      e.preventDefault();
      var data = $(this).val();
      $(this).html(data.replace(/<\S*script*>/, ''));
      $(this).parent().submit();
    }
  });
  $('#ciranda-content').on('change keyup paste', '.textarea-reply,.textarea-message-user-width-enter', function(e) {
    var obj = $(this);
    //console.log(obj.val().length);
    if(obj.val().length >= 2){
      //console.log('Mostrar botão');
      $('.send-comment',obj.parent()).show();
    }else{
      //console.log('Sumir botão');
      $('.send-comment',obj.parent()).hide();
    }
  })
  // Tratamento para caixa de comentário ficar maior quando receber o foco e menor a perder
  $('#ciranda-content').on('focus', '.textarea-reply', function() {
    $(this).attr('rows', '2');
    $('.options-media').hide();
    $('.options-media', $(this).parent().parent()).show();
    refreshWookmark();
  });
  $('.reply-textarea').on('blur', '.textarea-reply', function() {
    $(this).attr('rows', '1');
    refreshWookmark();
  });
  // Tratamento para que ao colar algum link seja executado o parser
  $('#ciranda-container').on('paste', '.parse-link', function(e) {
    var obj = $(this);
    setTimeout(function() {
      parse_link($(obj));
    }, 100);
    $(this).attr('placeholder', 'Qual sua opinião sobre isso?');
  });
  //Tratamento para apresentar / ocultar comentários
  $('#ciranda-content').on('click', '.comments-show a', function() {
    $(this).parent().parent().find('.comment-hidden').slideToggle(100);
    var comments = this;
    setTimeout(function() {
//      postSize(); // Este cara ferrado com o tamanho das coisas
      if ($(comments).parent().attr('alt') == 'show') {
        $(comments).html('Ocultar comentários (' + $(comments).parent().attr('rel') + ')');
        $(comments).parent().attr('alt', 'hide');
      } else {
        $(comments).html('Mostrar todos os comentários (' + $(comments).parent().attr('rel') + ')');
        $(comments).parent().attr('alt', 'show');
      }
      refreshWookmark();
    }, 101);
  });
  //Tratamento para apresentar / ocultar subcomentários
  $('#ciranda-content').on('click', '.subcomments-show a', function() {
    $(this).parent().parent().find('.subcomment-hidden').slideToggle(100);
    var subcomments = this;
    setTimeout(function() {
      if ($(subcomments).parent().attr('alt') == 'show') {
        $(subcomments).html('Ocultar subcomentários (' + $(subcomments).parent().attr('rel') + ')');
        $(subcomments).parent().attr('alt', 'hide');
      } else {
        $(subcomments).html('Mostrar todos os subcomentários (' + $(subcomments).parent().attr('rel') + ')');
        $(subcomments).parent().attr('alt', 'show');
      }
      refreshWookmark();
    }, 101);
  });
  // INICIO TRATAMENTO DE ENQUETE
  $('#ciranda-content').on('click', '.poll-close-button', function() {
    var button = $(this);
    var id = $(this).attr('id').split('_', 3);
    console.log(id);
    var activity_id = id[1];
    var html =
          '<div class="alert alert-warning" >' +
          '<button type="button" class="close" onclick="hideNotificationActivity(' + activity_id + ')">' +
          '  <span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
          '</button>' +
          'Deseja realmente encerrar esta enquete?<br/>' +
          '<button type="submit" class="apagar btn btn-xs btn-warning" title="Encerrar" onclick="pollClose(\'' + activity_id + '\')">Encerrar</button>' +
          '</form>' +
          '</div>';
    $('#container-notifications-activity-' + activity_id).html(html);
    refreshWookmark();
  });

  $('#ciranda-content').on('click', '.poll-result-list .button', function() {
    $(this).parent().find('ul').slideToggle(200);
    if ($(this).html() == 'Mostrar todas') {
      $(this).html('Ocultar');
    } else {
      $(this).html('Mostrar todas');
    }
  });
  try {
    $('.poll-status').progressbar({
      create: function(event, ui) {
        var $poll_id = $(this).parent().parent().find('input').attr('id').split('_')[1];
        var total = parseInt($('#' + $poll_id + '_answers_count').html());
        var status = (parseInt($(this).attr('title'), 10) * 100 / total);
        $(this).progressbar('option', 'value', status);
        $(this).css('height', $(this).parent().css('height') + 1);
      }
    });
  } catch (exception) {
  }

  $('#ciranda-content').on('change', '.poll-option', function() {
    var option = $(this)
            , totalObject = $('#' + option.attr('name') + '_answers_count')
            , activity = option.attr('id').split('_')[1]
            , option_id = option.attr('id').split('_')[3];
    $.post('/stack/index/vote', {
      activity_id: activity,
      poll_option: option_id
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

      socket.emit('broadcast', 'stack updated', activity);
    });
  });
  $('.new-poll-answer').click(function() {
    $(this).parent().find('.poll-input-answers').append('<input type="text" class="poll-answers span12" placeholder="Outra opção resposta" name="answers[]">')
  });
  // FIM TRATAMENTO DE ENQUETE

  // Tratamento para botões de compartilhamento 
  $('#ciranda-content').on('click', '.socialite-groupbutton', function() {
    var id = $(this).attr('id').split('_')[1];
    Socialite.load($("#boxActivitySocialButtons_" + id));
  });
  if ($("#social-networks-post").length == 1) {
    Socialite.load($("#social-networks-post"));
  }

  //LASY LOADING
  $(window).scroll(function() {
    if ($(window).scrollTop() >= $(document).height() - $(window).height() - 500) {
      $("#load-more").trigger('click');
    }
  });
  $('#ciranda-content').on('click', '#load-more', function() {
    if (lazyload !== "") {
      return false;
    } else {
      lazyload = setTimeout(function() {
        lazyload = "";
      }, 5000);
    }
    href = $(this).attr("href");
    rel = $(this).attr("rel") * 1;
    next_page = (rel + 1);
    target = $(this).attr("target");
    message = "Todos os itens foram listados!";
    calculate_column = $(this).attr('data-calculate-column');
    if (!target) {
      target = "#timeline";
      message = "Você já leu todas as atividades!";
    }

    var button = $('#load-more');
    $.ajax({
      url: href,
      beforeSend: function() {
        $('#load-more').html("Carregando...").addClass('load-more-active');
      },
      success: function(data) {
        data = $.trim(data);
        if ($(data).length > 0) {

          if (calculate_column) {
            $(data).each(function() {
              var $activity = $(this);
              addActivityInContent($(target), $activity);
              truncateActivity($activity);
            });
          } else {
            $(data).hide().appendTo($(target)).slideDown(200);
          }

          var newHref = href.replace('/page/' + rel, '/page/' + next_page);
          $('#load-more').attr('href', newHref);
          $('#load-more').html("Carregar mais").removeClass('load-more-active').attr('rel', next_page);
        } else {
          $('#load-more').html(message);
          $('#load-more').removeAttr('href');
          $('#load-more').removeAttr('id');
        }

        updateMediaPreview();

        try {
          $('.poll-status').progressbar({
            create: function(event, ui) {
              var $poll_id = $(this).parent().find('input').attr('name');
              var total = parseInt($('#' + $poll_id + '_answers_count').html());
              var status = (parseInt($(this).attr('title'), 10) * 100 / total);
              $(this).progressbar('option', 'value', status);
            }
          });
        }
        catch (exception) {
        }

        if (lazyload != "") {
          clearInterval(lazyload);
          lazyload = "";
        }
      }
    });
    return false;
  });
  // Gráfico estatísticas de atividade
  if ($('#activity-statistics-chart').length == 1) {
    $(function() {

      var startActivityEmailChartViewed = activityEmailChart.viewed[0]['0'].split('-'),
              startActivityEmailChartClicked = activityEmailChart.clicked[0]['0'].split('-');
      $('#activity-statistics-chart').highcharts({
        title: {
          text: '<br/>',
          margin: 50,
          useHTML: true
        },
        subtitle: {
          text: ''
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: {
            day: '%e %b'
          },
          labels: {
            align: 'left',
            x: 3,
            y: -3
          }
        },
        yAxis: [{
            title: {
              text: 'Total'
            },
            labels: {
              align: 'left',
              x: -2,
              y: 16,
              formatter: function() {
                return Highcharts.numberFormat(this.value, 0);
              }
            },
            showFirstLabel: false
          }],
        legend: {
          align: 'left',
          verticalAlign: 'top',
          y: 20,
          floating: true,
          borderWidth: 0
        },
        tooltip: {
          shared: true,
          crosshairs: true,
          dateTimeLabelFormats: '%Y'
        },
        plotOptions: {
          series: {
            cursor: 'pointer',
            point: {
              events: {
                click: function() {
                  hs.htmlExpand(null, {
                    pageOrigin: {
                      x: this.pageX,
                      y: this.pageY
                    },
                    headingText: this.series.name,
                    maincontentText: Highcharts.dateFormat('%e de %B', this.x) + '<br/> ' +
                            this.y + ' Notas',
                    width: 200
                  });
                }
              }
            },
            marker: {
              lineWidth: 1
            }
          }
        },
        series: [
          {
            data: activityEmailChart.viewed,
            name: 'Visualizações',
            lineWidth: 2,
            marker: {
              radius: 3
            },
            pointStart: Date.UTC(1970, startActivityEmailChartViewed[1] - 1, startActivityEmailChartViewed[0]),
            pointInterval: 24 * 3600 * 1000
          },
          {
            data: activityEmailChart.clicked,
            name: 'Cliques',
            lineWidth: 2,
            marker: {
              radius: 3
            },
            pointStart: Date.UTC(1970, startActivityEmailChartClicked[1] - 1, startActivityEmailChartClicked[0]),
            pointInterval: 24 * 3600 * 1000
          }
        ]
      });
    });
  }

  // INICIO FORM DE ROBOS
  function showRobotFieldsetByType(newType) {
    ['telemetry', 'twitter', 'facebook', 'email', 'feed', 'analytic'].forEach(function(type) {
      if (type == newType) {
        $('#fieldset-' + type).show();
      } else {
        $('#fieldset-' + type).hide();
      }
    });
  }
  if ($('#select_type_robot').length == 1) {
    showRobotFieldsetByType($('#select_type_robot').val());
  }
  $('#select_type_robot').on('change', function() {
    showRobotFieldsetByType($(this).val());
  });
  // FIM FORM DE ROBOS



  // GRAFICOS
  // grafico de top fontes de compartilhamento na tela de estatisticas
  if ($('#sharing-chart').length == 1) {
    $('#sharing-chart').highcharts({
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false
      },
      title: {
        text: ''
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            color: '#000000',
            connectorColor: '#000000',
            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
          }
        }
      },
      credits: {
        enabled: false
      },
      series: [{
          type: 'pie',
          data: top_referers_chart
        }]
    });
  }
  /* Gráficos estatísticas de post */
  if ($('#statistics-post-chart').length == 1) {
    var startStatisticsDates = statisticsDates[0][0].split('-');
    $('#statistics-post-chart').highcharts({
      title: {
        text: '<br/>',
        margin: 50,
        useHTML: true
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          day: '%e %b'
        },
        labels: {
          align: 'left',
          x: 3,
          y: -3
        }
      },
      yAxis: [{
          title: {
            text: ''
          },
          labels: {
            align: 'left',
            x: -2,
            y: 16,
            formatter: function() {
              return Highcharts.numberFormat(this.value, 0);
            }
          },
          showFirstLabel: false
        }],
      legend: {
        align: 'left',
        verticalAlign: 'top',
        y: 20,
        floating: true,
        borderWidth: 0
      },
      tooltip: {
        shared: true,
        crosshairs: true,
        dateTimeLabelFormats: '%Y'
      },
      plotOptions: {
        series: {
          cursor: 'pointer',
          point: {
            events: {
              click: function() {
                hs.htmlExpand(null, {
                  pageOrigin: {
                    x: this.pageX,
                    y: this.pageY
                  },
                  headingText: this.series.name,
                  maincontentText: Highcharts.dateFormat('%e de %B', this.x) + '<br/> ' +
                          this.y + ' ',
                  width: 200
                });
              }
            }
          },
          marker: {
            lineWidth: 1
          }
        }
      },
      credits: {
        enabled: false
      },
      /*scrollbar: {
       enabled: true,
       },*/
      series: [
        {
          data: statisticsDates,
          name: statisticsTitle,
          lineWidth: 1,
          marker: {
            radius: 3
          },
          pointStart: Date.UTC(1970, startStatisticsDates[1] - 1, startStatisticsDates[0]),
          pointInterval: 24 * 3600 * 1000
        }
      ]
    });
  }
  // FIM DOS GRAFICOS


  /* Interação / Manipulação de hashtags no formulário de Posts e Produtos */
  $('#newHashtag').focusout(function() {
//    console.log('add hashtag');
    var obj = $(this);
    actionHashtag(obj);
  });
  $('#ciranda-content').on('keydown', '#newHashtag', function(e) {
    var obj = $(this);
    if (e.which == 13 || e.which == 32 || e.which == 9) {
//      console.log('add hashtag');
      actionHashtag(obj);
      return false;
    }
  });
  if ($('#tags').length > 0) {
    hashtagString = $('#tags').val();
    hashtagList = (hashtagString == undefined || hashtagString == '') ? [] : hashtagList = hashtagString.split(',');
    hashtagList = hashtagList.map(function (hashtag) {
      return $.trim(hashtag)
    })
    for (var i = 0; i < hashtagList.length; i++) {
      $('ul#box-hashtag').append('<li class="item-hashtag"><a href="/search/' + hashtagList[i].replace(/#/, '%23') + '">' + hashtagList[i] + '</a></li>')
    }
  }
  $('#ciranda-content').on('mouseenter', 'li.item-hashtag', function() {
    $(this).append('<a href="#" title="Remover hashtag" class="link-remove-hashtag">  ' +
            '<span class="glyphicon glyphicon-remove"></span></a>');
    $('a.link-remove-hashtag').click(function() {
      $(this).parent().remove();
      hashtag = $(this).parent().text();
      removeHashtag(hashtag);
      if ($('#save-hashtag-post-public').length > 0) {
        $('#save-hashtag-post-public').show().html('Salvar');
      }
      return false;
    });
  }).on('mouseleave', 'li.item-hashtag', function() {
    $('a.link-remove-hashtag').remove();
  });
  $('#ciranda-content').on('click', '#related-hashtags ul li a', function() {
    var hashtag = $(this).html();
    relatedHashtags.splice(relatedHashtags.indexOf(hashtag), 1);
    addHashtag($(this), hashtag);
    $(this).parent().remove();
    if ($('#related-hashtags ul li').length == 0) {
      $('#related-hashtags').fadeOut();
    }
    return false;
  });
  $('#save-hashtag-post-public').click(function() {
    var post = $('#id_post_hashtag').val();
    var hashtags = $('#tags').val();
    $.ajax({
      url: '/activity/addhashtags',
      type: 'POST',
      data: {hashtags: hashtags, post: post},
      dataType: 'json',
      beforeSend: function() {
        $('#save-hashtag-post-public').addClass('disabled').html('Salvando..');
      },
      success: function(responseText) {
        $('#save-hashtag-post-public').removeClass('disabled').html('Salvo com sucesso!').delay(1000).fadeOut();
      }
    });
    return false;
  });
  /* FINAL Interação / Manipulação de hashtags no formulário de Posts e Produtos */


  // UPLOAD DE ANEXOS EM POSTS (IMAGENS E VIDEOS)
  $("#newImagePost2").click(function() {
    $("#formMediaPost").attr("action", "/upload").hide().fadeIn();
    $("#fileMediaPost").trigger("click").hide();
    return false;
  });
  $("#fileMediaPost").bind('change', function() {
    if ($('#media_capa').val() == 'true') {
      $('#loadingAttachFileCapa').append('<center><img src="/img/loading.gif" alt="Carregando" id="loadingImagePostCapa" /></center>');
    } else {
      $('#loadingAttachFile').append('<center><img src="/img/loading.gif" alt="Carregando" id="loadingImagePost"/></center>');
    }
    $('#formMediaPost').trigger('submit');
    return false;
  });
  $('#formMediaPost').ajaxForm({
    type: 'post',
    dataType: 'json',
    data: {
      entity_id: portal.entity_id,
      status: 'waiting'
    },
    success: function(response) {
      $('#loadingAttachFile').html('');
      $('#previewPost img#loadingImagePost').remove();
      var content =
              "<div class='previewCombo' id='previewCombo" + response.title + "'>" +
              "<input class='checkbox checkbox-new-media-post' checked='checked' type='checkbox' name='" + response.title + "' value='" + response.title + "'/>" +
              "<img src='" + response.thumb + "' width='24' height='24'/>" +
              "<p class='title'>" + response.title + "</p>" +
              "</div>";
      $('#previewPost').append(content);
      var medias = $('#mediaPreviewPost').val();
      if (medias != '') {
        medias = JSON.parse(medias);
      } else {
        medias = [];
      }
      medias.push(response);
      $('#mediaPreviewPost').val(JSON.stringify(medias));
    }
  });
  $("input.checkbox-new-media-post").livequery('click', function() {
    var self = $(this);
    if (self.is(":checked") == false) {

      if ($("#mediaPreviewRemovido").val() != "") {
        var removidos = JSON.parse($("#mediaPreviewRemovido").val());
      } else {
        var removidos = new Array();
      }
      var anexos = JSON.parse($("#mediaPreviewPost").val());
      var novosAnexos = new Array();
      $.each(anexos, function(i) {
        if (self.val() == this.title) {
          removidos.push(this);
        } else {
          novosAnexos.push(this);
        }
      });
      $('#mediaPreviewRemovido').val(JSON.stringify(removidos));
      $('#mediaPreviewPost').val(JSON.stringify(novosAnexos));
    } else {
      var anexos = JSON.parse($("#mediaPreviewPost").val());
      var anexosRemovidos = JSON.parse($("#mediaPreviewRemovido").val());
      var novosRemovidos = new Array();
      $.each(anexosRemovidos, function() {
        if (self.val() == this.title) {
          anexos.push(this);
        } else {
          novosRemovidos.push(this)
        }
      });
      $('#mediaPreviewPost').val(JSON.stringify(anexos));
      $('#mediaPreviewRemovido').val(JSON.stringify(novosRemovidos));
    }
  });
  // FIM DO UPLOAD DE ANEXOS EM POSTS (IMAGENS E VIDEOS)


  //POSTAGEM DE POSTS
  $('#savePost, #publishPost').click(function() {
    $('#actionFormPost').val($(this).attr('name'));
  });
  //FIMM POSTAGEM DE POSTS

  //DIFF DE POSTS
  $('input.version1').change(function() {
    var i = $(this).attr('id').split('_')[1];
    i++;
    $('input.version2').attr('checked', false);
    $('#version2_' + i).attr('checked', true);
  });
  //FIM DIFF DE POSTS

  //AUTO COMPLETES
  if ($("#profile-id-gallery").length > 0) {
    execAutocomplete($("#profile-gallery"), "profile-id-gallery", "/profiles/autocomplete", "{}");
  }
  if ($("#profile_search").length > 0) {
    execAutocomplete($("#profile_search"), 'profile_id_search_activities', '/profiles/autocomplete', '{}');
  }
  //FIM AUTO COMPLETES


  //FIXAR UMA ATIVIDADE
  $('#ciranda-content').on('click', 'a.blog-pinit , a.blog-unpinit', function() {
    var activity = $(this).attr('id').split('_')[1];
    var object = $(this);
    var data = {
      activity_id: activity,
      option: object.attr('class') == 'blog-pinit' ? 'pinit' : 'unpinit'
    };
    $.ajax({
      url: '/blogs/pinit',
      type: 'GET',
      data: data,
      success: function(response) {
        if (response.status == 'success') {
          showAlertGeneral('success', response.message);
          object.attr('class', 'blog-unpinit');
        }
      },
      error: function(response) {
        showResponseError(response, null, {
          subject: 'Erro ao fixar atividade',
          rota: '/blogs/pinit',
          data: data
        });
      }
    });
  });
  //FIM FIXAR UMA ATIVIDADE

  //INICIO DESCRIÇÃO DE HASHTAGS
  $('#description-hash-save').click(function() {
    $('.description-hash-search').hide();
    $('#hashtag-description').show();
    return false;
  });
  $('#description-hash-cancel').click(function() {
    $('.description-hash-search').show();
    $('#hashtag-description').hide();
    return false;
  });
  $('#hashtag-submit').click(function() {
    var id
            , description
            , profile_id
            , dados = {}
    , container
            , descriptionUsename
            , descriptionName;
    dados['id'] = $('#hashtag-id').val();
    dados['profile_id'] = $('#hashtag-profile-id').val();
    dados['description'] = $('#textarea-description').val();
    dados = JSON.stringify(dados);
    $.ajax({
      url: '/hashtags/savedescription',
      type: 'POST',
      data: {data: dados},
      dataType: 'json',
      beforeSend: function() {
        $('#hashtag-submit').addClass('disabled').val('Salvando...');
      },
      success: function(responseText) {
        $('#hashtag-submit').removeClass('disabled').val('Salvo com sucesso!');
        /* adição */
        if ($('#desciption-edit-container').length == 0) {
          descriptionName = $('#description-name').html();
          descriptionUsername = $('#description-username').html();
          container = '<div id="desciption-edit-container">';
          container += '<b>Descrição da hashtag: </b>';
          container += '<span id="desc-hash"></span>';
          container += ' <a href="#" id="description-hash-save" title="Alterar descrição da hashtag"><span class="glyphicon glyphicon-edit"></span></a>';
          container += '<p>Última edição feita por <a href="/user/' + descriptionUsername + '" title="' + descriptionName + '">' + descriptionName + '</a></p>';
          container += '</div>';
          $('.description-hash-search').html(container);
        }
        ;
        /* edição */
        $('.description-hash-search #desciption-edit-container span#desc-hash').html($('#textarea-description').val());
        $('#hashtag-description').hide();
        $('.description-hash-search').show();
        $('#hashtag-submit').val('Salvar');
        showAlertGeneral('success', 'Descrição salva com sucesso!');
      }
    });
  });
  var timerHash = null;
  var $tooltipHash = null;
  $('#ciranda-content').on('mouseenter', 'a.hashtag-description', function() {
    $tooltipHash = $(this);
    var hashtag = $(this).html();
    var description = null;
    timerHash = setTimeout(function() {
      $.ajax({
        url: '/hashtags/getdescriptionhashtag',
        data: {hashtag: hashtag},
        type: 'get',
        dataType: 'json',
        beforeSend: function() {
          $tooltipHash.attr('title', 'Carregando...');
        },
        complete: function(res, status) {
          if (status == 'success') {
            description = JSON.parse(res.responseText);
            if (description) {
              $tooltipHash.attr('title', description);
            } else {
              $tooltipHash.attr('title', 'Essa hashtag não possui descrição');
            }
          } else {
            $tooltipHash.attr('title', 'Não foi possível recuperar a descrição desta hashtag');
          }
          $tooltipHash.tooltip('show');
          setTimeout(function() {
            $tooltipHash.tooltip('hide');
          }, 3000);
        }
      });
    });
  }).on('mouseleave', 'a.hashtag-description', function() {
    clearTimeout(timerHash);
    if ($tooltipHash !== null) {
      $tooltipHash.tooltip('hide');
    }
  });
  //FIM INICIO DESCRIÇÃO DE HASHTAGS  

  //BUSCA E APRESENTA PESSOAS QUE CURTIRAM UMA ATIVIDADE
  $('#ciranda-content').on('mouseenter', 'a.show-likesOwners', function() {
    var showLikes = 5
            , type = null
            , activity = null
            , activityId = null
            , activityIdArray = null
            , profileLikesLength = null
            , profilesLike
            , namesProfiles = [];
    activityId = $(this).children().attr('id');
    activityIdArray = $(this).children().attr('id').split('_');
    for (var i = 0; i < activityIdArray.length; i++) {
      if ($.isNumeric(activityIdArray[i])) {
        var activity = activityIdArray[i];
      }
      ;
      if (activityIdArray[i] == 'activity') {
        type = activityIdArray[i];
      } else if (activityIdArray[i] == 'comment') {
        type = activityIdArray[i];
      }
    }
    ;
    $.ajax({
      url: '/likes/getlikes',
      type: 'GET',
      data: {activity: activity, type: type},
      beforeSend: function() {
        $('#' + activityId).parent().attr('data-title', 'Carregando...');
      },
      complete: function(jqXHR, status) {
        if (status = 'success') {
          profilesLike = JSON.parse(jqXHR.responseText);
          if (profilesLike.length > 0) {
            if (profilesLike.length >= showLikes) {
              profileLikesLength = showLikes;
            } else {
              profileLikesLength = profilesLike.length;
            }
            for (var i = 0; i < profileLikesLength; i++) {
              namesProfiles += (i > 0 ? ', ' : '') + profilesLike[i].name;
            }
            ;
            if (profilesLike.length == showLikes + 1) {
              namesProfiles += ' e mais 1 pessoa curtiu.';
            } else if (profilesLike.length > showLikes + 1) {
              namesProfiles += ' e mais ' + (profilesLike.length - showLikes) + ' pessoas curtiram.';
            }
          }
          ;
          $('#' + activityId).parent().attr('data-title', namesProfiles);
          $('#' + activityId).parent().tooltip('show');
          setTimeout(function() {
            $('#' + activityId).parent().tooltip('hide');
          }, 2000);
        }
        ;
      }
    });
  }).on('mouseleave', 'a.show-likesOwners', function() {
    var activityId = $(this).children().attr('id');
    $('#' + activityId).parent().tooltip('hide');
  });
  //FIM BUSCA E APRESENTA PESSOAS QUE CURTIRAM UMA ATIVIDADE

  //APRESENTA MODAL COM PESSOAS QUE CURTIRAM
  $('#ciranda-content').on('click', 'a.show-likesOwners', function() {
    var type = null
            , activity = null
            , activityId = null
            , activityIdArray = null
            , profileLikesLength = null
            , profilesLike
            , namesProfiles = []
            , avatar;
    activityId = $(this).children().attr('id');
    activityIdArray = $(this).children().attr('id').split('_');
    for (var i = 0; i < activityIdArray.length; i++) {
      if ($.isNumeric(activityIdArray[i])) {
        var activity = activityIdArray[i];
      }
      ;
      if (activityIdArray[i] == 'activity') {
        type = activityIdArray[i];
      } else if (activityIdArray[i] == 'comment') {
        type = activityIdArray[i];
      }
    }
    ;
    $.ajax({
      url: '/likes/getlikes',
      type: 'GET',
      data: {activity: activity, type: type},
      complete: function(jqXHR, status) {
        if (status = 'success') {
          profilesLike = JSON.parse(jqXHR.responseText);
          if (profilesLike.length > 0) {

            namesProfiles = '<ul class="user-list-like">';
            for (var i = 0; i < profilesLike.length; i++) {
              namesProfiles += '<li><a href="/user/' + profilesLike[i].username + '">';
              namesProfiles += '<img class="img-circle" src="' + profilesLike[i].avatar + '"/>';
              namesProfiles += '<span>' + profilesLike[i].name + '</span>';
              namesProfiles += '</a></li>';
            }
            ;
            namesProfiles += '</ul>';
            showModal('Pessoas que curtiram esta publicação', namesProfiles)
          }
          ;
        }
        ;
      }
    });
    return false;
  });
  //FINAL APRESENTACAO MODAL COM PESSOAS QUE CURTIRAM


  //NOTIFICAÇÕES
  //le as notificações ao clicar no icon
  $('#notifications-dropdown').click(function() {
    $('.alert_global').html('');
    $.ajax({
      url: '/notifications/read',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
//        console.log(response.message);
        iconBubble('reset');
      },
      error: function(response) {
        console.log('Erro ao ler notificações');
      }
    });
  });
//  $('#topo .notificacao .notify-box a.messages').click(function() {
//    if ($('.unread-conversation').length > 0) {
//      $("#topo .notificacao .notify-box .global_tooltip").hide();
//      $("#topo .notificacao .notify-box .messages_tooltip").toggle();
//    }
//  });
  //FIM NOTIFICAÇÕES

  // IMAGEM DE AVATAR DE BLOGS / CIRANDAS / PROFILES e PRODUTOS
  $('#mediaImage').ajaxForm(options = {
    type: 'post',
    dataType: 'json',
    data: {size: 350, entity_id: portal.entity_id},
    beforeSubmit: function() {
      $("#submit").val("Carregando..").attr("disabled", "disabled");
      $('#arquivo_preview_crop_image').imgAreaSelect({
        remove: true
      });
    },
    success: function(responseText) {
      $("#submit").val("Salvar").removeAttr("disabled");
      if (responseText.error) {
        showAlertGeneral('error', data.error);
        return false;
      }

      path = responseText.url;
      $('.form-tspdhtmlform-arquivo_preview img#loadingEditPerfil').remove();
      $('#url_path').val(path);
      $('#arquivo_preview_crop').hide().fadeIn();
      $('#arquivo_preview_crop > img').eq(0).attr('src', path);
      $('#arquivo_preview_croped > img').eq(0).attr('src', path);
      x2y2 = $("#crop_x2y2").val();
      if (!x2y2) {
        x2y2 = 170;
      }

      $('#image').val(path);
      $('#arquivo_preview_crop_image').imgAreaSelect({
        handles: true,
        aspectRatio: '1:1',
        onInit: arquivo_previewXY,
        onSelectChange: arquivo_preview,
        onSelectEnd: arquivo_previewXY,
        x1: 50,
        y1: 50,
        x2: x2y2,
        y2: x2y2
      });
    }
  });
  $("#arquivo").bind('change', function() {
    $('.form-tspdhtmlform-arquivo_preview').append('<img src="/img/loading.gif" alt="Carregando" id="loadingEditPerfil"/>');
    $('#mediaImage').attr('action', '/upload');
    $('#mediaImage').trigger('submit');
  });
  // FIM IMAGEM DE AVATAR DE BLOGS / CIRANDAS / PROFILES e PRODUTOS


  // avatar do robô
  if ($('#avatar').length > 0) {
    if ($('#avatar').val() != '') {
      $('#previewAvatarRobot').show().html('<img src="' + $('#avatar').val() + '" />');
    }
  }
  //upload de foto no perfil dos robos
  $('#newImageRobot').click(function() {
    $('#formMediaRobot').attr('action', '/upload');
    $('#fileMediaRobot').trigger('click').hide();
    return false;
  });
  $('#fileMediaRobot').bind('change', function() {
    $('#newImageRobot').addClass('disabled').html('Carregando pré-visualização...');
    $('#formMediaRobot').trigger('submit');
    return false;
  });
  $('#formMediaRobot').ajaxForm({
    type: 'post',
    dataType: 'json',
    success: function(responseText) {
      $('#avatar').val(responseText.url + ' ').trigger('focus').trigger('keyup');
      $('#newImageRobot').removeClass('disabled').html('Alterar imagem');
      $('#previewAvatarRobot').show();
      $('#previewAvatarRobot').html('<img src="' + $('#avatar').val() + '" />');
      $('#previewRobotTitle').show();
    },
    complete: function() {
      $('#newImageRobot').removeClass('disabled').html('Adicionar imagem ao perfil...');
    }
  });
  //FIM - upload de foto no perfil dos robos

  // Links internos da ciranda quando o usuário está deslogado
  /*if (profileSocket.id == 'guest') {
   $('a').click(function() {
   var link = this + '';
   if (link.match(/product\/[a-zA-Z]+\/timeline/s)) {
   $('.nav-toggle').click();
   return false;
   }
   });
   }*/

  //página de rqcode
  if ($('#btndraftmember').length > 0) {
    $('#btndraftmember').click(function() {
      var obj = $(this);
      $(obj).html('...').addClass('disabled');
      var params = {
        blog_id: $('#btndraftmember').attr('data-blogid'),
        only_new: $('#only_new').is(':checked') ? 1 : 0
      };
      $.ajax({
        url: '/blogs/draftmember',
        type: 'POST',
        data: params,
        dataType: 'json',
        success: function(data) {
          if (data.status == 'success') {
            $('img#imgqrcode').fadeOut(1000, function() {
              $('img#imgqrcode').attr('src', data.user.avatar);
              $('img#imgqrcode').fadeIn(1000, function() {
                $('h3.titleqrcode').html('<small>Usuário Sorteado:</small> ' + data.user.name);
                $('h3.titleqrcode').css('color', 'green');
              });
            });
            $('#btncleardraftmember').fadeIn();
            $(obj).hide();
          } else {
            showAlertGeneral('danger', data.message);
          }
        },
        error: function(data) {
          showResponseError(data, null, {
            subject: 'Erro ao fixar atividade',
            rota: '/blogs/draftmember',
            data: params
          });
        },
        complete: function(data) {
          $(obj).html('Sortear Usuário').removeClass('disabled');
        }
      });
    });

    $('#btncleardraftmember').click(function() {
      $(this).fadeOut();
      $('img#imgqrcode').fadeOut(1000, function() {
        $('img#imgqrcode').attr('src', $('img#imgqrcode').attr('data-qrcode'));
        $('img#imgqrcode').fadeIn();
      });
      $('#btndraftmember').fadeIn();
      $('h3.titleqrcode').html('Utilize o QR Code abaixo para ingressar na rede!');
      $('h3.titleqrcode').css('color', 'black');
    });
  }

  //INICIO ARÉAS DE INTERESSE NO FLOW
  if ($('#avaliable-interest-areas-activity').length > 0) {
    //se for edição de post do flow precisa popular as áreas já selecionadas
    if ($('#fieldset-interest-areas-post-edit').length > 0) {
      $('#avaliable-interest-areas-activity').html('');
      var interestsPost = $('#interest-areas-profile').val().split(',');
      var currentInterests = $('.interest_areas').val();
      if (currentInterests != '') {
//        $('#interest-areas-subtitle-selected').show();
      }
      interestsPost.sort();
      $.each(interestsPost, function(index, value) {
        if (value) {
          if (currentInterests.match(value + ',')) {
            addInterestAreaActivityElementeLI(value);
          } else {
            addInterestAreaAvaliableToActivityElementLI(value);
          }
        }
      });
    } else {
      populateAvaliableInterestAreaActivity();
    }
  }

  // Formulário de preferências de notificação

  $('#notifications-form').submit(function(e) {
    e.preventDefault();
    $form = $(this);
    $.ajax({
      url: '/profiles/editnotifications',
      method: 'post',
      data: $form.serializeArray(),
      dataType: 'json',
      beforeSend: function() {
        $('#notifications-form-btn').addClass('disabled');
        $('#notifications-form-btn').val('Salvando...');
      },
      success: function(res) {
        showAlertGeneral('success', res.message);
      },
      error: function(res) {
        showResponseError(res, null, {
          subject: 'Erro ao alterar preferências de notificação',
          rota: '/profiles/editnotifications',
          data: $form.serializeArray()
        });
      },
      complete: function() {
        $('#notifications-form-btn').removeClass('disabled');
        $('#notifications-form-btn').val('Salvar');
      }
    })
  });

  // Busca na galeria

  $('#show-options-gallery').click(function() {
    $('#gallery-option-user').toggle();
    if ($('#show-options-gallery i').attr('class') == 'glyphicon glyphicon-chevron-up') {
      $('#show-options-gallery i').removeClass().addClass('glyphicon glyphicon-chevron-down');
    } else {
      $('#show-options-gallery i').removeClass().addClass('glyphicon glyphicon-chevron-up');
    }
    return false;
  });

  // Edição de avatares

  $('#form-search-gallery-submit').click(function() {
    $('#form-search-gallery').submit();
  });

  if ($('#change-picture')) {
    $('#change-picture').parent().mouseenter(function() {
      $('#change-picture p.mouseenter-picture').show();
      $('#change-picture').addClass('change-picture-hover');
    }).mouseleave(function() {
      $('#change-picture p.mouseenter-picture').hide();
      $('#change-picture').removeClass('change-picture-hover');
    });
  }

  // Ocultar cover

  $('#cover-hide').click(function() {
    var data = {};
    data.profile_id = $('#cover-hide').attr('data-id');
    data.config = $('#cover-hide').attr('data-config');
    data.value = $('#cover-hide').attr('data-value');

    $.ajax({
      url: '/profiles/setconfig',
      method: 'post',
      data: data,
      dataType: 'json',
      beforeSend: function() {
        $('.ciranda-loading', '#cover-hide').show();
      },
      success: function(res) {
        if (data.value == 0) {
          $('#container-cover-fluid').slideDown();
          $('#cover-hide').attr('data-value', 1);
          $('#cover-hide').removeClass().addClass('glyphicon glyphicon-chevron-up');
          $('#container-header .cover-buttons').css('margin-top', '-35px');
        } else {
          $('#container-cover-fluid').slideUp();
          $('#cover-hide').attr('data-value', 0);
          $('#cover-hide').removeClass().addClass('glyphicon glyphicon-chevron-down');
          $('#container-header .cover-buttons').css('margin-top', '0');
        }
      },
      error: function(res) {
        showResponseError(res, null, {
          subject: 'Erro ao ocultar capa',
          rota: '/profiles/setconfig',
          data: data
        });
      },
      complete: function() {
        $('.ciranda-loading', '#cover-hide').hide();
      }
    });
  });

// Ocultar cover

  $('#sidebar-fixed').click(function() {
    var data = {};
    data.profile_id = $('#sidebar-fixed').attr('data-id');
    data.config = $('#sidebar-fixed').attr('data-config');
    data.value = $('#sidebar-fixed').attr('data-value');

    $.ajax({
      url: '/profiles/setconfig',
      method: 'post',
      data: data,
      dataType: 'json',
      beforeSend: function() {
        if ($(window).width() < 768 || !data.config || !data.value || !data.profile_id) {
          return false;
        }
      },
      success: function(res) {
        if (data.value == 0) {
          $('#sidebar-fixed').attr('data-value', 1);
        } else {
          $('#sidebar-fixed').attr('data-value', 0);
        }
      },
      error: function(res) {
        showResponseError(res, null, {
          subject: 'Erro ao fixar capa',
          rota: '/profiles/setconfig',
          data: data
        });
      },
      complete: function() {
      }
    });
  });

  $('#schedule, .date-picker-hour').datetimepicker({
    lang: 'pt',
    format: 'd/m/Y H:i'
  });

  /* Upload de logo para entidades */

  $('#entity-logo').ajaxForm({
    success: function(data) {
      $('#entity-logo-loading').fadeOut();
      var logoPath = data.result;
      $('#entity-logo img.entity-logo').attr('src', portal.media_server + logoPath).show();
      $('#logo').val(logoPath);
      $('#entity-logo a').show();
    },
    error: function(err) {
      $('#entity-logo-loading').fadeOut();
      var response = JSON.parse(err.responseText);
      alert('Erro: ' + response.message);
    }
  });

  $('#entity-logo-file').change(function() {
    $('#entity-logo-loading').fadeIn();
    $('#entity-logo').submit();
  });

  $('#entity-logo a').click(function() {
    $('#entity-logo img.entity-logo').hide();
    $('#logo').val('');
    $(this).hide();
  });

  if ($('#logo').length && $('#logo').val() != '') {
    $('#entity-logo img.entity-logo').attr('src', portal.media_server + $('#logo').val()).show();
    $('#entity-logo a').show();
  }

  $(document).on('click', '.activity-versions', function() {
    var activity_id = $(this).data('activity_id');
    var comment_id = $(this).data('comment_id');

    var data = {comment_id: comment_id, activity_id: activity_id};

    $.ajax({
      url: '/activity/versions',
      method: 'post',
      data: data,
      beforeSend: function() {
        showModal('Versões Anteriores', '<div class="ciranda-loading"></div>');
      },
      success: function(res) {
        $('#modal .modal-body').html(res);
      },
      error: function(res) {
        showResponseError(res, null, {
          subject: 'Erro ao exibir versões anteriores de atividade',
          rota: '/activity/versions',
          data: data
        });
      }
    });
  });

  /* notificações com ajax */
  $('#notifications-dropdown').click(function() {
    var data = {profile_id: profileSocket.id};
    $.ajax({
      url: '/profiles/getnotifications',
      method: 'get',
      data: data,
      dataType: 'json',
      beforeSend: function() {
        if ($('#notifications-list li.notify_ajax').length > 0) {
          return false;
        }
        $('.ciranda-loading', '#notifications-list').show();
      },
      success: function(res) {
        if (res.status == 'success') {

          if (res.data) {
            var notifications = res.data;
            for (var i = 0; i < notifications.length; i++) {
              if (notifications[i].image) {
                if (notifications[i].image.substr(0, 4) == 'http') {
                  var imageNotification = notifications[i].image;
                } else {
                  var imageRel = notifications[i].image.charAt(0) !== '/' ? '/' + notifications[i].image : notifications[i].image;
                  var imageNotification = portal.media_server + imageRel;
                }
              } else {
                var imageNotification = '/img/ciranda.ico';
              }

              var thumbNotification = '';
              if (notifications[i].thumbnail !== '' && notifications[i].thumbnail !== null) {
                var thumbRel = notifications[i].thumbnail.charAt(0) !== '/' ? '/' + notifications[i].thumbnail : notifications[i].thumbnail;
                thumbNotification = '<img class="thumbnail-notify" src="' + portal.media_server + thumbRel + '" />';
              }

              $('#notifications-list').append('<li id="notify_' + notifications[i].id + '" class="notify_ajax">' +
                      '<a href="' + notifications[i].link + '"><img class="img-circle" src="' + imageNotification + '"/>' +
                      '<p class="message-notify">' + notifications[i].message + '</p>' + thumbNotification +
                      '<p class="date-notify date_time" title="' + notifications[i].created_at + '">' + notifications[i].created_at + '</p>' +
                      '</a></li>');
            }
          }
        }
      },
      error: function(res) {
        showResponseError(res, null, {
          subject: 'Erro ao buscar notificações',
          rota: '/profiles/getnotifications',
          data: data
        });
      },
      complete: function() {
        $('.ciranda-loading', '#notifications-list').hide();
      }
    });
  });

  $('#schedule').datetimepicker({
    lang: 'pt',
    format: 'd/m/Y H:i'
  });

  //INICIO IMPLEMENTAÇÕES TELA PREMIUM
  if ($('input#current_service').length > 0) {
    var serviceId = $('input#current_service').val();
    $('.col' + serviceId).addClass('success');

    $('.plan').click(function() {
      $('#current_plan').val($(this).val());

      var serviceId = $(this).attr('data-service-id');
      $('table#packed_servces th, table#packed_servces td').removeClass('success');
      $('.col' + serviceId).addClass('success');
      $('.plan').prop('checked', false);
      $(this).prop('checked', true);
      $('#current_service').val(serviceId);
    });
  }
  //form da cielo
  $('.bandeira').click(function() {
    $('.bandeira').removeClass('selected');
    $(this).addClass('selected');
    $('#bandeira_pedido').val($(this).attr('id'));
  });
  //INICIO IMPLEMENTAÇÕES TELA PREMIUM

  if ($('#tab-flow').length > 0) {
    var notificationsTimelineFlow = localStorage.getItem('timeline-flow');
    if (notificationsTimelineFlow !== 0 && !isNaN(notificationsTimelineFlow)) {
      $('#tab-flow a span').addClass('badge');
      $('#tab-flow a span').html(notificationsTimelineFlow);
    }
  }

  if ($('#tab-business').length > 0) {
    var notificationsTimelineBusiness = localStorage.getItem('timeline-business');
    if (notificationsTimelineBusiness !== 0 && !isNaN(notificationsTimelineBusiness)) {
      $('#tab-business a span').addClass('badge');
      $('#tab-business a span').html(notificationsTimelineBusiness);
    }
  }

  //Filtro FLOW
  if ($('#flow-filter').length > 0) {
    populateCurrentInterestAreasFilter();

    $('.type-flow-filter').click(function() {
      if ($(this).val() == 'all') {
        $('#flow-specifics-filters').hide();
      } else {
        $('#flow-specifics-filters').show();
      }
    });

    $('#btn-apply-flow-filter').click(function() {
      if ($('#type-flow-filter-all').is(':checked')) {
        $('#current_filter_interest_areas').val('');
      }
    });

    $('.interest_area_atwho').atwho({
      at: "",
      data: '/interestareas/autocomplete/',
      tpl: "<li data-value='${name}'>${name}</li>",
      limit: 15
    });

    $('body').on('keydown', '.interest_area_atwho', function(e) {
      if (e.which == 13 || e.which == 9 || e.which == 188) { //enter, tab, virgula
        insertNewInterestAreaInFilter();
      }
    });

  }

  $('.hideshow').click(function() {
    var elementId = $(this).attr('data-target');
    $(elementId).slideToggle();
    var element = $(this).find('span');
    if ($(element).hasClass('glyphicon-chevron-down')) {
      $(element).removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
    } else {
      $(element).removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
    }
  });

  if ($('#btn-copy-link-blog').length > 0) {
    var client = new ZeroClipboard( $('#btn-copy-link-blog'), {
      moviePath: "/plugins/zeroClipboard/ZeroClipboard.swf",
      debug: false
    });
  }

  //CONTABILIZA CLICKS NOS LINKS DENTRO DO POST
  $(".post-text-in a").click(function(){
    if ($(this).attr("href") && !$(this).hasClass("no_register_click")) {
      var banner_id;
      if($(this).hasClass('banner-ciranda')){ 
        banner_id = $(this).data('id');
      }
      var img = $(this).find("img:first");
      $.ajax({
        url: '/activity/registerclicklink',
        type: 'POST',
        data: {
          activity_id: $("#activity_id").val(),
          banner_id: banner_id,
          sharer_id: $("#profile_sharer").val(),
          html: $(this).html(),
          title: $(this).attr("title"),
          link: $(this).attr("href"),
          alt: $(this).attr("alt"),
          img_alt: $(img).attr("alt"),          
          img_title: $(img).attr("title")          
        },
        success: function(response) {
          console.log("Click registrado com sucesso");
        },
        error: function(response) {
          return false;
        }
      });
      
      location.herf = $(this).attr("href");    
    }
  });

  $(".post-text-in a.read_more_post").click(function(){
    $.ajax({
      url: '/activity/registerclickreadmorepost',
      type: 'POST',
      data: {
        activity_id: $("#activity_id").val(),
        access_id: $("#access_id").val()
      },
      success: function(response) {
        console.log("Click registrado com sucesso");
      },
      error: function(response) {
        return false;
      }
    });
  });


  $('#ad_type').change(function(){
    if($(this).val() == 'adsense'){
      $('.form-textarea-value').removeClass('hidden');
      $('.form-text-link').addClass('hidden');
      $('.form-button-file').addClass('hidden');
    }else if($(this).val() == 'banner'){
      $('.form-textarea-value').addClass('hidden');
      $('.form-text-link').removeClass('hidden');
      $('.form-button-file').removeClass('hidden');
    }else{
      $('.form-text-link').removeClass('hidden');
      $('.form-textarea-value').addClass('hidden');
      $('.form-button-file').addClass('hidden');
    }
  })

  $('#previewPosts').click(function(e){
    e.preventDefault();
    
    if (CKEDITOR.instances.ckeditor_post) {
      $('#ckeditor_post').html(CKEDITOR.instances.ckeditor_post.getData());
    }

    var $btn = $(this);
    var data = $(this).closest('form').serialize();

    if(!$('#titlePost').val() || !CKEDITOR.instances.ckeditor_post.getData()){
      showAlertGeneral('danger', 'Os campos título e descrição precisam estar preenchidos para o preview');
      return false;
    }

    $.ajax({
        url: '/blogs/postpreview',
        type: 'POST',
        data: data,
        beforeSend:function(){
          $btn.val('Carregando...');
        },
        success: function(response) {
          console.log("Preview");
          $('#post-preview-content').html(response);
          $('#post-preview').show();
          $('html,body').animate({
             scrollTop: $("#post-preview").offset().top -50
          });
        },
        error: function(response) {
          console.log(response);
          return false;
        },
        complete:function(){
          $btn.val('Preview');
        }
      });
  });

});
/**********************************************************************************************/
/**************************            FUNÇÕES               **********************************/
/**********************************************************************************************/

// Limpa as notificações das abas business e social
function clearNotificationsTab(type) {
  if (type === 'flow') {
    localStorage.removeItem('timeline-flow');
  } else {
    localStorage.removeItem('timeline-business');
  }
}

// Adiciona a elemente (atividade) no content
function addActivityInContent($content, $activity) {
  if (typeof $activity == 'undefined') {
    return false;
  }
  $($activity).removeClass(function(index, css) {
    if (css === undefined) {
      return false;
    }
    return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
  });
  $($activity).width('100%');
  $($activity).attr('data-sort', $('#timeline .timeline-box').length + 1);
  if (!$('#timeline').hasClass('one-layout')) {
    var last_left_post = $('.timeline-left');
    var last_right_post = $('.timeline-right');
    var left_position = 0;
    var right_position = 0;
    left_position = last_left_post.height() + last_left_post.offset().top;
    right_position = last_right_post.height() + last_right_post.offset().top;
    if (left_position <= right_position) {
      $($activity).appendTo('.timeline-left');
    } else {
      $($activity).appendTo('.timeline-right');
    }
  } else {
    $($activity).appendTo('.one', $content);
  }
  $('.activity-media-gallery', $activity).slick({dots: true, arrows: false});
}

// criar layout duas colunas e com espaçaemnto entre elas
function createWookmark() {
  $timeline = $('#timeline');
  if ($timeline.hasClass('two-layout')) {
    return false;
  }
  var items = $('#timeline .timeline-box');
  items.removeClass(function(index, css) {
    return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
  });
  if ($(window).width() >= 975) {
    var left_column_height = 0;
    var right_column_height = 0;
    var $timeline_left = $('.timeline-left');
    var $timeline_right = $('.timeline-right');
    for (var i = 0; i < items.length; i++) {
      items.eq(i).width('100%');
      if (!items.eq(i).attr('data-sort')) {
        items.eq(i).attr('data-sort', i);
      }
      if (left_column_height > right_column_height) {
        right_column_height += items.eq(i).detach().appendTo($timeline_right).outerHeight(true);
//      right_column_height += items.eq(i).addClass('right').outerHeight(true);
      } else {
        left_column_height += items.eq(i).detach().appendTo($timeline_left).outerHeight(true);
//      left_column_height += items.eq(i).addClass('left').outerHeight(true);
      }
    }
    $timeline.addClass('two-layout');
    $timeline.removeClass('one-layout');
  } else {
    items.removeClass(function(index, css) {
      return (css.match(/(^|\s)col-\S+/g) || []).join(' ');
    });
    for (var i = 0; i < items.length; i++) {
      items.eq(i).width('100%');
      items.eq(i).attr('data-sort', i);
    }
    $('.one', $timeline).append(items);
    $timeline.removeClass('two-layout');
    $timeline.addClass('one-layout');
  }

}

function umaColuna() {
  var $timeline = $('#timeline');
  if ($timeline.hasClass('one-layout')) {
    return false;
  }
  var list = $('#timeline .timeline-box');
  list.sort(function(a, b) {
    return $(a).attr('data-sort') - $(b).attr('data-sort');
  })

  list.detach().appendTo('.one', $timeline);
  $timeline.addClass('one-layout');
  $timeline.removeClass('two-layout');
}


// Atualiza o posicionamento das atividade nas timeline, 
// executar sempre que realizar alguma ação que muda o tamanho de uma atividade
function refreshWookmark(timeout) {
//  if (typeof timeout == 'undefined') {
//    timeout = 0;
//  }
//  setTimeout(function(){
//    console.log('refreshiou');
//    $('#timeline .container-activity').trigger('refreshWookmark');    
//  }, timeout);
}

// Verifica a existencia de um link e envia para rota de parser
function parse_link(obj, data) {
  var parent = $(obj).parent().parent();
  var nameMedia = null;
  if (typeof data === 'undefined') {
    data = $(obj).val();
  } else {
    if (typeof data.name != 'undefined') {
      nameMedia = data.name;
      data = data.url;
    }
  }

  var exp1 = /(http|ftp|https):\/\/[\w\-_|\.[\w\-_]+\.(com|org|net|mil|edu|ca|co.uk|com.au|gov|br)+([\w\-\.,()@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])? /g;
  exp1 = new RegExp(exp1);
  test1 = exp1.test(data);
  var exp2 = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,()@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;
  exp2 = new RegExp(exp2);
  test2 = exp2.test(data);
  if ((test2 == true) || (test1 == true)) {


    // Oculta o botão de anexo do formulario
    $form = obj.closest('form');
    $('.form-activity-file', $form).hide();
    $.ajax({
      url: '/activity/midia',
      data: {
        data: data
      },
      dataType: 'html',
      contentType: 'text/html; charset=utf-8',
      beforeSend: function() {
        $('.previewMedia', parent).css('margin', '5px 0px').css('position', 'relative').fadeIn();
        $('.previewMedia', parent).prepend('<center><img src="/img/loading.gif" alt="Carregando" id="loadingImageActivity" /></center>');
        $('.publishActivity', parent).attr('disabled', true);
        $('.messagesMedia', parent).html('');
        $('.atc_info', parent).hide();
        $('.atc_paginator', parent).hide();
        $('.previewMedia .preview-image', parent).hide();
        refreshWookmark();
        resizeInboxUser();
      },
      complete: function(jqXHR, status) {
        if (status == 'success') {
          try {
            var response = jqXHR.responseText;
            response = JSON.parse(response);
            response = response[0];
            if (typeof response.error == 'undefined') {
              $('.previewMedia', parent).append(getTemplateMediaPreview(parent));
            } else {
              $('.publishActivity', parent).attr('disabled', false);
              $('.previewMedia', parent).html('').hide();
              $('.messagesMedia', parent).append('<div class="alert alert-error fade in error-media boxsizingBorder"><button type="button" class="close" data-dismiss="alert">×</button>' + response.error + '</div>');
              return false;
            }
          } catch (exception) {
            $('.publishActivity', parent).attr('disabled', false);
            $('.previewMedia', parent).html('').hide();
            $('.messagesMedia', parent).append('<div class="alert alert-error fade in error-media boxsizingBorder"><button type="button" class="close" data-dismiss="alert">×</button>Não foi possível concluir processamento de mídia. Tente novamente.</div>');
            return false;
          }

          if (nameMedia) {
            $('.atc_title', parent).html(nameMedia);
          } else {
            $('.atc_title', parent).html(response.title);
          }
          $('.atc_url', parent).html(response.url);
          $('.atc_desc', parent).html(response.description);
          if (response.kind == 'page') {
            $('.input-medias', parent).val(jqXHR.responseText);
            $('.atc_images', parent).html(' ');
            var i = 0;
            $.each(response.images, function(a, b) {
              $('.atc_images', parent).append('<img src="' + b + '" class="span12" id="' + (i + 1) + '">');
              i++;
            });
            if (i > 1) {
              $('.atc_desc_type_media', parent).html('imagens');
            } else {
              $('.atc_desc_type_media', parent).html('imagem');
            }

            $('.atc_total_images', parent).html(i);
            $('.atc_images img', parent).hide();
            $('img#1', parent).fadeIn();
            $('.cur_image', parent).val(1);
            $('.cur_image_num', parent).html(1);
          } else {
            var medias = $('.input-medias', parent).val();
            if (medias != '') {
              medias = JSON.parse(medias);
              if (nameMedia != null) {
                response.title = nameMedia;
              }
              if (medias[0].kind != 'page') {
                medias.push(response);
                $('.input-medias', parent).val(JSON.stringify(medias));
              } else {
                $('.input-medias', parent).val(jqXHR.responseText);
              }
            } else {
              var new_media = JSON.parse(jqXHR.responseText);
              if (nameMedia) {
                new_media[0].title = nameMedia;
              }
              $('.input-medias', parent).val(JSON.stringify(new_media));
            }

            var total_imagens = parseInt($('.atc_total_images', parent).html());
            if (total_imagens > 0) {
              total_imagens++;
              $('.atc_desc_type_media', parent).html('medias');
            } else {
              total_imagens = 1;
              $('.atc_desc_type_media', parent).html('media');
            }
            $('.atc_total_images', parent).html(total_imagens);
            $('.cur_image', parent).val(total_imagens);
            $('.cur_image_num', parent).html(total_imagens);
            $('.atc_images img', parent).hide();
            $('.atc_images', parent).append('<img src="' + response.thumb + '" class="span12" id="' + total_imagens + '">');
          }

          var valNewActivity = $(obj).val();
          valNewActivity = valNewActivity.replace(exp2, '');
          $(obj).val(valNewActivity);
          $('.attach_content', parent).fadeIn('slow');
        }

        $('.atc_info', parent).show();

        $('.previewMedia', parent).each(function() {
          var $self = $(this);
          var $img = $self.find('.preview-image img');
          $('<img/>').attr('src', $img.attr('src')).load(function() {
            if (this.width < 40 || this.height < 40)
              return;
            if (this.width < 430) {
              $('.preview-image', $self).attr('class', 'col-lg-6 col-md-6 col-sm-6 col-xs-6 preview-image');
              $('.page-data', $self).attr('class', 'col-lg-6 col-md-6 col-sm-6 col-xs-6 page-data atc_info');
            } else {
              $('.preview-image', $self).attr('class', 'col-lg-12 col-md-12 col-sm-12 col-xs-12 preview-image');
              $('.page-data', $self).attr('class', 'col-lg-12 col-md-12 col-sm-12 col-xs-12 page-data atc_info');
            }
            $('.atc_paginator', parent).show();
            $('.previewMedia .preview-image', parent).show();
          });
        });

        $('#loadingImageActivity', parent).remove();
        $('.publishActivity', parent).attr('disabled', false);
        refreshWookmark();
        resizeInboxUser();
      },
      error: function(data) {
        $('.publishActivity', parent).attr('disabled', false);
        $('.previewMedia', parent).append('<div class="alert alert-error fade in error-media boxsizingBorder"><button type="button" class="close" data-dismiss="alert">×</button>Não foi possível concluir processamento da Media.</div>');
        $('.previewMedia', parent).html('').hide();
      }
    });
  }
}

// Retorna o HTML padrão que é apresentado o preview das medias
function getTemplateMediaPreview(obj) {
  if ($('.attach_content', obj).length == 0) {
    var html =
            '<div class="row">' +
            '<div class="attach_content col-lg-12 col-md-12 col-sm-12 col-xs-12">' +
            '<div class="row">' +
            '<input type="hidden" class="cur_image" />' +
            '<div style="display: none" class="preview-image col-lg-12 col-md-12 col-sm-12 col-xs-12">' +
            '<center><div class="atc_images"></div></center>' +
            '</div>' +
            '<div class="atc_info page-data col-lg-12 col-md-12 col-sm-12 col-xs-12">' +
            '<p class="atc_title"></p>' +
            '<p class="atc_url"></p>' +
            '<p class="atc_desc"></p>' +
            '<div class="atc_paginator" style="display: none">' +
            '<div class="atc_total_image_nav" >' +
            '<a href="javascript:void(0)" class="prev" onclick="changeMediaPreview(this, \'preview\'); return false;"><span class="glyphicon glyphicon-chevron-left"</span></a>' +
            '<a href="javascript:void(0)" class="next" onclick="changeMediaPreview(this, \'next\'); return false;"><span class="glyphicon glyphicon-chevron-right"</span></a>' +
            '</div>' +
            '<div class="atc_total_images_info" >' +
            'Apresentado <span class="cur_image_num">0</span> de <span class="atc_total_images">0</span> <span class="atc_desc_type_media">imagens</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    return html;
  } else {
    return '';
  }
}

// Função para paginação de imagens no preview
function changeMediaPreview(obj, operation) {
  var parent = $(obj).closest('form');
  var total_medias = parseInt($('.atc_total_images', parent).html());
  if (total_medias > 0) {
    var index = $('.cur_image', parent).val();
    $('img#' + index, parent).hide();
    if (operation == 'next') {
      if (index < total_medias) {
        new_index = parseInt(index) + parseInt(1);
      } else {
        new_index = 1;
      }
    } else {
      if (index > 1) {
        new_index = parseInt(index) - parseInt(1);
      } else {
        new_index = total_medias;
      }
    }
    $('.cur_image', parent).val(new_index);
    $('.cur_image_num', parent).html(new_index);
    $('img#' + new_index, parent).show();
    var jsonMediaPreview = JSON.parse($('.input-medias', parent).val());
    if (jsonMediaPreview[0].kind == 'page') {
      jsonMediaPreview[0].thumb = $('img#' + new_index, parent).attr('src');
      $('.input-medias', parent).val(JSON.stringify(jsonMediaPreview));
    } else {
      $('.atc_title', parent).html(jsonMediaPreview[new_index - 1].title);
      $('.atc_url', parent).html(jsonMediaPreview[new_index - 1].url);
      $('.atc_desc', parent).html(jsonMediaPreview[new_index - 1].description);
    }
  }
  return false;
}

// FUNÇÃO PARA CURTIR
function like(object, parent_type, parent, related_activities, timeline) {
  if (typeof related_activities == 'undefined') {
    related_activities = 0;
  }
  if (typeof timeline == 'undefined') {
    timeline = 0;
  }
  var params = {
    parent_type: parent_type,
    parent_id: parent,
    related_activities: related_activities,
    timeline: timeline
  };
  $.ajax({
    url: '/likes/add',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      var data = response.html;
      $(object).fadeOut(200, function() {
        $(object).parent().html(data);
        $(object).fadeIn();
        var likes_count = $('#' + parent_type + '_' + parent + '_likes_count');
        var count = parseInt(likes_count.html()) + 1;
        if (!count) {
          count = 1;
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
      });
      socket.emit('broadcast', 'new like', parent_type, parent);
      if (related_activities) {
        getRelatedActivities(parent, timeline);
      }
    },
    error: function(response) {
      return showResponseError(res, null, {
        subject: 'Erro ao curtir',
        rota: '/likes/add',
        data: params
      });
    }
  });
}

// FUNÇÃO PARA DESCURTIR
function unlike(object, like, parent_type, parent_id, related_activities, timeline) {
  if (typeof related_activities == 'undefined') {
    related_activities = 0;
  }
  if (typeof timeline == 'undefined') {
    timeline = 0;
  }
  var params = {
    like_id: like,
    parent_type: parent_type,
    parent_id: parent_id,
    related_activities: related_activities,
    timeline: timeline
  };
  $.ajax({
    url: '/likes/delete',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      var data = response.html;
      $(object).fadeOut(200, function() {
        $(object).parent().html(data);
      });
      $(object).fadeIn();
      var likes_count = $('#' + parent_type + '_' + parent_id + '_likes_count');
      var count = parseInt(likes_count.html()) - 1;
      var plural = count > 1 ? ' curtiram' : ' curtiu';
      likes_count.fadeOut(200, function() {
        $(this).html(count + plural);
        if (count >= 1) {
          $('#' + parent_type + '_' + parent_id + '_post_e').fadeIn();
          likes_count.fadeIn();
        } else {
          $('#' + parent_type + '_' + parent_id + '_post_e').fadeOut();
          likes_count.fadeOut();
        }
      });
      socket.emit('broadcast', 'new unlike', parent_type, parent_id);
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao descurtir',
        rota: '/likes/delete',
        data: params
      });
    }
  });
}

// Função que apaga qualquer notificação de uma atividade
function hideNotificationActivity(activity_id) {
  $('#container-notifications-activity-' + activity_id).html('');
  refreshWookmark();
}

// Função que apresenta alert de cancelamento de Atividades na Timeline
function showFormDeleteActivity(activity_id, refresh_page) {
  var html =
          '<div class="alert alert-warning" >' +
          '<button type="button" class="close" onclick="hideNotificationActivity(' + activity_id + ')">' +
          '  <span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
          '</button>' +
          'Deseja realmente apagar esta atividade?' +
          '<form action="/activity/delete" method="post" id="' + activity_id + '_delete"' +
          'onsubmit="deleteActivity(this, \'' + activity_id + '\', ' + refresh_page + '); return false;" class="post-delete">' +
          '<input type="hidden" value="' + activity_id + '" name="activity_id"/>' +
          '<button type="submit" class="apagar btn btn-xs btn-warning" title="Apagar">Apagar</button>' +
          '</form>' +
          '</div>';
  $('#container-notifications-activity-' + activity_id).html(html);
  refreshWookmark();
}

//função que deleta uma atividade
function deleteActivity(object, activity, refreshPage) {
  $.ajax({
    url: '/activity/delete',
    type: 'POST',
    data: $(object).serialize(),
    success: function(response) {
      if (response.status == 'success') {
        $('#container-activity-' + activity).remove();
        refreshWookmark();
        socket.emit('broadcast', 'remove activity', activity);
        if (refreshPage) {
          window.location = response.link_redirect;
        }
      }
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao excluir atividade',
        rota: '/activity/delete',
        data: $(object).serialize()
      });
    }
  });
}

// Função que apaga qualquer notificação de uma atividade
function hideNotificationComment(comment_type, comment_id) {
  $('#container-notifications-' + comment_type + '-' + comment_id).html('');
  refreshWookmark();
}

// Função que apresenta alert de cancelamento de Atividades na Timeline
function showFormDeleteComment(comment_type, activity_id, comment_id) {
  var html =
          '<div class="alert alert-warning" >' +
          '<button type="button" class="close" onclick="hideNotificationComment(\'' + comment_type + '\', ' + comment_id + ')">' +
          '  <span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
          '</button>' +
          'Deseja realmente apagar este comentário?' +
          '<form action="/activity/deletecomment" method="post" id="' + comment_id + '_delete"' +
          '  onsubmit="deleteComment(this, \'' + comment_id + '\', \'' + activity_id + '\', \'' + comment_type + '\'); return false;" class="post-delete">' +
          '<input type="hidden" value="' + comment_id + '" name="comment"/>' +
          '<button type="submit" class="apagar btn btn-xs btn-warning" title="Apagar">Apagar</button>' +
          '</form>' +
          '</div>';
  $('#container-notifications-' + comment_type + '-' + comment_id).html(html);
  refreshWookmark();
}

// Função apagar comentário
function deleteComment(object, comment, post, type) {
  $.post('/activity/deletecomment', $(object).serialize(), function(data) {
    $('#' + type + '_' + comment).remove();
    var count = parseInt($('#' + post + '_comments_count').html());
    $('#' + post + '_comments_count').html(count - 1).show('slow');
    refreshWookmark();
    socket.emit('broadcast', 'remove ' + type, comment);
  });
  return false;
}

function showActivityEdit(id) {
  if (!$('#activity-edit-' + id + ' form').length) {
    var $form = $('<form data-id="' + id + '" class="form-activity-edit"><button type="submit" class="btn btn-success btn-sm" type="button">Salvar</button><span class="btn btn-danger btn-sm" onclick="hideActivityEdit(' + id + ')">Cancelar</span></form>');
    $form.prepend($('#activity-edit-' + id).html());
    $('#activity-edit-' + id).html($form);
  }
  $('#activity-text-' + id).addClass('hidden');
  $('#activity-edit-' + id).removeClass('hidden');
  $('#activity-edit-' + id + ' textarea').focus();
}
function hideActivityEdit(id) {
  $('#activity-text-' + id).removeClass('hidden');
  $('#activity-edit-' + id).addClass('hidden');
  return false;
}

function showCommentEdit(id, activity_id) {
  if (!$('#comment-edit-' + id + ' form').length) {
    var $form = $('<form data-id="' + id + '" data-activity="' + activity_id + '" class="form-comment-edit"><button type="submit" class="btn btn-success btn-sm">Salvar</button><span class="btn btn-danger btn-sm" onclick="hideCommentEdit(' + id + ')">Cancelar</span></form>');
    $form.prepend($('#comment-edit-' + id + ' textarea'));
    $('#comment-edit-' + id).html($form);
  }
  $('#comment-text-' + id).addClass('hidden');
  $('#comment-edit-' + id).removeClass('hidden');
  $('#comment-edit-' + id + ' textarea').focus();
}
function hideCommentEdit(id) {
  $('#comment-text-' + id).removeClass('hidden');
  $('#comment-edit-' + id).addClass('hidden');
  return false;
}

// Função que apresentar textarea de resposta em comentários
function showReplyTextareaComment(activity_id, comment_id) {
  $('#reply-textarea-' + activity_id + '' + comment_id).removeClass('hidden');
  $('#textarea-reply-' + activity_id + comment_id).focus();
  refreshWookmark();
}

// Função que grava um compartilhamento no momento em que o usuário clica em compartilhar um link
function newShare(activity_id) {
  $.ajax({
    url: '/activity/sharecount',
    type: 'POST',
    data: {activity_id: activity_id},
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        return true;
      }
    },
    error: function(response) {
      return false;
    }
  });
}

//função
function changeRoleUser(obj, blog_id, profile_id) {
  $.ajax({
    url: '/blogs/changerole/' + blog_id + '/' + profile_id,
    type: 'POST',
    data: {
      role: $(obj).val()
    },
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $(obj).parent().append('<span class="glyphicon glyphicon-ok green"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      } else {
        $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      }
    },
    error: function(response) {
      $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
      return showResponseError(response, null, {
        subject: 'Erro ao excluir atividade',
        rota: '/blogs/changerole/' + blog_id + '/' + profile_id,
        data: {role: $(obj).val()}
      });
    }
  });
}

// Função remover usuario de um blog
function unjoin(object, blog, profile) {
  $.ajax({
    url: '/blogs/unjoin/' + blog + '/profile/' + profile,
    type: 'POST',
    data: {},
    success: function(response) {
      $('#member-' + profile).fadeOut(500);
      showAlertGeneral('success', 'Membro removido com sucesso');
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao remover usuário de um blog',
        rota: '/blogs/unjoin/' + blog + '/profile/' + profile
      });
    }
  });
}

// Executa auto complete em campos se selecão
function execAutocomplete(obj, field_id, route, params) {
  var item;
  var dados;
  params = JSON.parse(params);
  $.ajax({
    url: route,
    data: params,
    dataType: 'json',
    success: function(data) {
      item = data;
      $(obj).autocomplete({
        source: item,
        focus: function(event, ui) {
          $('#' + field_id).val(ui.item.id);
        },
        select: function(e, ui) {
          item = jQuery.grep(item, function(element) {
            return element.id != ui.item.id;
          });
          $(obj).autocomplete('option', 'source', item);
          $(obj).trigger('selectregistry', {registry: ui.item});
        },
        minLenght: 1,
        max: 5
      }).data('ui-autocomplete')._renderItem = function(ul, item) {
        var inner_html = '<a><div class="list_item_container row">';
        if (typeof item.image != 'undefined') {
          inner_html += '<div class="user-image col-lg-1 col-md-1 col-sm-1 col-xs-1">';
          inner_html += '<img class="img-circle" src="' + item.image + '"/>';
          inner_html += '</div>';
        }
        inner_html += '<div class="col-lg-11 col-md-11 col-sm-11 col-xs-11">';
        inner_html += '<div class="label">' + item.label + '</div>';
        if (typeof item.description != 'undefined') {
          inner_html += '<div class="description">' + item.description + '</div>';
        }
        inner_html += '</div>';
        inner_html += '</div></a>';
        return $('<li></li>').data('item.autocomplete', item)
                .append(inner_html).appendTo(ul);
      };
    }
  });
}

// convida um usuário para participar de um blog
function inviteUserToBlog(form) {
  if ($('#invite-user-hidden').val() == '' || $('#invite-user-hidden').val() == null) {
    $('#btnSendInvite').removeClass('disabled').html('Convidar usuário');
    showAlertGeneral('danger', 'Informe um usuário válido.');
    return false;
  }

  $.ajax({
    url: $(form).attr('action'),
    type: 'POST',
    data: $(form).serialize(),
    beforeSend: function() {
      $("#btnSendInvite").addClass("disabled").html("Convidando...");
    },
    success: function(response) {
      if (response.status == 'success') {

        $("#invite_user option:selected").remove();
        $("#invite_user").val("");
        $("#invite-user").val("");
        $("#invite-user-hidden").val("");
        $('#message-invite-user').hide();
        $("#invited-list").append(response.html);
        if ($("#not-found-invite").length) {
          $("#not-found-invite").hide();
        }
        $("#invite_user").focus();
        $("#solicitation-not-found").fadeOut();
      } else {
        showAlertGeneral('danger', response.message);
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao convidar usuário para um blog',
        rota: $(form).attr('action'),
        data: $(form).serialize()
      });
    },
    complete: function() {
      $("#btnSendInvite").removeClass("disabled").html("Convidar Usuário");
    }
  });
}

// Função apaga uma solicitação, seja ela um invite ou solicitation
function delSolicitation(object, blog, solicitation) {
  var params = {
    blog_id: blog,
    solicitation_id: solicitation
  };
  $.ajax({
    url: '/blogs/delsolicitation',
    type: 'POST',
    data: params,
    success: function(response) {
      $('#solicitation-' + solicitation).fadeOut(1000).remove();
      if ($('.solicitations').length == 0) {
        $("#solicitation-not-found").fadeIn();
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao remover solicitação (invite/solicitation)',
        rota: '/blogs/delsolicitation',
        data: params
      });
    }
  });
}

// Função aprova uma solicitação, seja ela um invite ou solicitation
function approveSolicitation(object, blog, solicitation) {
  var params = {
    blog_id: blog,
    solicitation_id: solicitation
  };
  $.ajax({
    url: '/blogs/approvesolicitation',
    type: 'POST',
    data: params,
    success: function(response) {
      $('#solicitation-' + solicitation).fadeOut(1000).remove();
      if ($('.solicitations').length == 0) {
        $("#solicitation-not-found").fadeIn();
      }
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao aprovar solicitação (invite/solicitation)',
        rota: '/blogs/approvesolicitation',
        data: params
      });
    }
  });
}

// Função Adiciona Robo a um grupo
function addRobotGroup(obj, group, robot) {
  var params = {
    group: group,
    robot: robot
  };
  $.ajax({
    url: '/blogs/addrobot',
    type: 'POST',
    data: params,
    success: function(response) {
      $(obj).attr('title', 'Adicionar');
      $(obj).attr('onclick', 'removeRobotGroup(this, "' + group + '", "' + robot + '");');
      $(obj).html('<span class="glyphicon glyphicon-remove"></span>');
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao adicionar robô à um grupo',
        rota: '/blogs/addrobot',
        data: params
      });
    }
  });
}

// Função Remove Robo de um grupo
function removeRobotGroup(obj, group, robot) {
  var params = {
    group: group,
    robot: robot
  };
  $.ajax({
    url: '/blogs/removerobot',
    type: 'POST',
    data: params,
    success: function(response) {
      $(obj).attr('title', 'Adicionar');
      $(obj).attr('onclick', 'addRobotGroup(this, "' + group + '", "' + robot + '");');
      $(obj).html('<span class="glyphicon glyphicon-plus"></span>');
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao remover robô de um grupo',
        rota: '/blogs/removerobot',
        data: params
      });
    }
  });
}

// Função Faz usuário seguir um usuário, seja este user ou blog
function follow(obj, follow_id, type_user) {
  if (typeof type_user == 'undefined') {
    type_user = '';
  }
  var params = {
    follow_id: follow_id,
    typeuser: type_user
  };
  $.ajax({
    url: '/profiles/follow',
    type: 'POST',
    data: params,
    success: function(response) {
      if (type_user == 'blog') {
        $(obj).attr('title', 'Deixar de Receber Atualizações');
      } else {
        $(obj).attr('title', 'Deixar de Seguir');
      }
      $(obj).attr('onclick', 'unfollow(this, "' + follow_id + '", "' + type_user + '");');
      $(obj).html('<span class="glyphicon glyphicon-eye-close"></span>');
      localStorage.removeItem("users-follow-date");
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao seguir usuário (user/blog)',
        rota: '/profiles/follow',
        data: params
      });
    }
  });
}

// Função Faz usuário DEIXAR de seguir um usuário, seja este user ou blog
function unfollow(obj, follow_id, type_user) {
  if (typeof type_user == 'undefined') {
    type_user = '';
  }
  var params = {
    follow_id: follow_id,
    typeuser: type_user
  };
  $.ajax({
    url: '/profiles/unfollow',
    type: 'POST',
    data: params,
    success: function(response) {
      if (type_user == 'blog') {
        $(obj).attr('title', 'Receber Atualizações');
      } else {
        $(obj).attr('title', 'Seguir');
      }
      $(obj).attr('onclick', 'follow(this, "' + follow_id + '", "' + type_user + '");');
      $(obj).html('<span class="glyphicon glyphicon-eye-open"></span>');
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao deixar de seguir usuário (user/blog)',
        rota: '/profiles/unfollow',
        data: params
      });
    }
  });
}

// Função para aprovar e recusar publicações
function moderateAction(obj) {
  $(obj).addClass('disabled');
  $.ajax({
    url: $(obj).attr('href'),
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      if (data.status == 'success') {
        $('#publication-' + $(obj).attr('data-id')).fadeOut(700).remove();
        showAlertGeneral('success', data.message);
        if (data.updateTimeline) {
          socket.emit('timeline updated');
        }
      } else {
        showAlertGeneral('danger', data.message);
        $(obj).removeClass('disabled');
      }
    },
    error: function(data) {
      showAlertGeneral('danger', data.statusText);
      $(obj).removeClass('disabled');
    }
  });
  return false;
}

//apresenta alert para box
function showAlertBox(status, message) {
  $("#alert-general").slideUp(500).removeClass('alert-success').removeClass('alert-info')
          .removeClass('alert-error').addClass('alert-' + status)
          .html('<button type="button" class="close" onclick="$(this).parent().slideUp(500);">&times;</button><p>' + message + '</p>').slideDown(500);
}

// Altera o papel de um usuário dentro da entidade
function changeRoleUserEntity(obj, entity_id, profile_id) {
  var params = {
    entity_id: entity_id,
    profile_id: profile_id,
    role_id: $(obj).val()
  };
  $.ajax({
    url: '/entities/changeroleuser',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $(obj).parent().append('<span class="glyphicon glyphicon-ok green"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      } else {
        $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      }
    },
    error: function(response) {
      $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
      return showResponseError(response, null, {
        subject: 'Erro ao alterar papel de usuário dentro da entidade',
        rota: '/entities/changeroleuser',
        data: params
      });
    }
  });
}

// Remove usuário da entidade
function removeUserFromEntity(obj, entity_id, profile_id) {
  var params = {
    entity_id: entity_id,
    profile_id: profile_id
  };
  $.ajax({
    url: '/entities/unjoin',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $('#member-' + profile_id).fadeOut(500);
        showAlertGeneral('success', 'Membro removido com sucesso');
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao remover usuário da entidade',
        rota: '/entities/unjoin',
        data: params
      });
    }
  });
}

// Altera usuário como funcionário ou não
function executeChangeEntityEmployee(obj, entity_id, profile_id) {
  if ($(obj).is(':checked')) {
    addEntityEmployee(obj, entity_id, profile_id);
  } else {
    var html =
            '<div id="messages-denounce" class="alert" style="display: none;"></div>' +
            '<div class="form-group">' +
            '<p>Após retirar função de colaborador, o usuário deixará de participar de todos blogs e grupos ' +
            'restritos a colaboradores e terá seu papel alterado para USUÁRIO nos demais. <br>' +
            'Após sua confirmação tais alterações NÃO poderão ser revertidas.' +
            '</p>' +
            '</div>' +
            '<div class="pull-right">' +
            '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" style="margin-right: 10px;" />' +
            '<input type="submit" class="btn btn-info" value="Remover" onclick="removeEntityEmployee(' + entity_id + ', ' + profile_id + ')"/>' +
            '</div>';
    $(obj).prop('checked', true);
    showModal('Deseja realmente remover função de Colaborador do usuário?', html);
  }
}

function addEntityEmployee(obj, entity_id, profile_id) {
  var params = {
    entity_id: entity_id,
    profile_id: profile_id
  };
  $.ajax({
    url: '/entities/addemployee',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      showAlertGeneral('success', response.message);
      $(obj).parent().append('<span class="glyphicon glyphicon-ok green"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao adicionar função de colaborador do usuário',
        rota: '/entities/addemployee',
        data: params
      });
      $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
      $(obj).prop('checked', !$(obj).is(':checked'));
      return false;
    }
  });
}

// Remove função de colaborador do usuário
function removeEntityEmployee(entity_id, profile_id) {
  var params = {
    entity_id: entity_id,
    profile_id: profile_id
  };
  $.ajax({
    url: '/entities/removeemployee',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      showAlertGeneral('success', response.message);
      $('#employee_user_' + profile_id).prop('checked', false);
      hideModal();
      $('#employee_user_' + profile_id).parent().append('<span class="glyphicon glyphicon-ok green"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao remover função de colaborador do usuário',
        rota: '/entities/removeemployee',
        data: params
      });
      $('#employee_user_' + profile_id).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
        $(this).find('span').fadeOut(1000);
        nxt();
      });
      return false;
    }
  });
}


// convida um usuário para participar de uma Ciranda
function inviteUserToEntity(form) {
  if ($('#invite-user-hidden').val() == '' || $('#invite-user-hidden').val() == null) {
    $('#btnSendInvite').removeClass('disabled').html('Convidar usuário');
    showAlertGeneral('danger', 'Informe um usuário válido.');
    return false;
  }

  $.ajax({
    url: $(form).attr('action'),
    type: 'POST',
    data: $(form).serialize(),
    beforeSend: function() {
      $("#btnSendInvite").addClass("disabled").html("Convidando...");
    },
    success: function(response) {
      if (response.status == 'success') {

        $("#invite_user option:selected").remove();
        $("#invite_user").val("");
        $("#invite-user").val("");
        $("#invite-user-hidden").val("");
        $('#message-invite-user').hide();
        $("#invited-list").append(response.html);
        if ($("#not-found-invite").length) {
          $("#not-found-invite").hide();
        }
        $("#invite_user").focus();
        $("#solicitation-not-found").fadeOut();
        showAlertGeneral('success', response.message);
      } else {
        showAlertGeneral('danger', response.message);
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao convidar usuário para participar de uma Ciranda',
        rota: $(form).attr('action'),
        data: $(form).serialize()
      });
    },
    complete: function() {
      $("#btnSendInvite").removeClass("disabled").html("Convidar Usuário");
    }
  });
}

// função para participar de um ciranda
function joinEntity(obj, entity_id) {
  var params = {entity_id: entity_id};
  $.ajax({
    url: '/entities/join',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $(obj).attr('onclick', 'unjoinEntity(this, "' + entity_id + '")');
        $(obj).attr('title', 'Sair desta Ciranda');
        $(obj).html('<span class="glyphicon glyphicon-log-out"></span>');
//        $('#active_entity').append('<option value="' + response.data.entity_slug + '">' + response.data.entity_title + '</option>');
      } else if (response.status == 'waiting-moderate') {
        var parent = $(obj).parent();
        $(parent).html('<span class="waiting-invite">Aguardando convite</span>');
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao participar de uma Ciranda',
        rota: '/entities/join',
        data: params
      });
    }
  });
}

// função para deixar de participar de uma ciranda
function unjoinEntity(obj, entity_id, profile_id) {
  var params = {entity_id: entity_id};
  $.ajax({
    url: '/entities/unjoin',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $(obj).attr('onclick', 'joinEntity(this, "' + entity_id + '")');
        $(obj).attr('title', 'Participar desta Ciranda');
        $(obj).html('<span class="glyphicon glyphicon-log-in"></span>');
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao deixar de participar de uma Ciranda',
        rota: '/entities/unjoin',
        data: params
      });
    }
  });
}

// remove convite de usuário ou entidade em uma ciranda
function denyUserEntity(obj, entity_id, solicitation_id, type) {
  var action = '/entities/denyuser';
  if (type == 'entity') {
    action = '/entities/denyentity';
  }

  var params = {
    entity_id: entity_id,
    solicitation_id: solicitation_id
  };
  $.ajax({
    url: action,
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      $('#solicitation-' + solicitation_id).fadeOut(1000).remove();
      if ($('.solicitations').length == 0) {
        $("#solicitation-not-found").fadeIn();
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao remover convite de usuário ou entidade em uma Ciranda',
        rota: action,
        data: params
      });
    }
  });
}

// aprova usuário convite de usuário ou entidade em uma ciranda
function approveUserEntity(obj, entity_id, solicitation_id, type) {
  var action = '/entities/approveuser';
  if (type == 'entity') {
    action = '/entities/approveentity';
  }

  var params = {
    entity_id: entity_id,
    solicitation_id: solicitation_id
  };
  $.ajax({
    url: action,
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      $('#solicitation-' + solicitation_id).fadeOut(1000).remove();
      if ($('.solicitations').length == 0) {
        $("#solicitation-not-found").fadeIn();
      }
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao aprovar convite de usuário ou entidade em uma Ciranda',
        rota: action,
        data: params
      });
    }
  });
}

// convida uma Ciranda para ser parceira
function inviteEntityToBePartner(form) {
  if ($('#invite-user-hidden').val() == '' || $('#invite-user-hidden').val() == null) {
    $('#btnSendInvite').removeClass('disabled').html('Convidar Ciranda');
    showAlertGeneral('danger', 'Informe um ciranda válida.');
    return false;
  }

  $.ajax({
    url: $(form).attr('action'),
    type: 'POST',
    data: $(form).serialize(),
    beforeSend: function() {
      $("#btnSendInvite").addClass("disabled").html("Convidando...");
    },
    success: function(response) {
      if (response.status == 'success') {

        $("#invite_user option:selected").remove();
        $("#invite_user").val("");
        $("#invite-user").val("");
        $("#invite-user-hidden").val("");
        $('#message-invite-user').hide();
        $("#invited-list").append(response.html);
        if ($("#not-found-invite").length) {
          $("#not-found-invite").hide();
        }
        $("#invite_user").focus();
        $("#solicitation-not-found").fadeOut();
        showAlertGeneral('success', response.message);
      } else {
        showAlertGeneral('danger', response.message);
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao convidar Ciranda para ser parceira',
        rota: $(form).attr('action'),
        data: $(form).serialize()
      });
    },
    complete: function() {
      $("#btnSendInvite").removeClass("disabled").html("Convidar Ciranda");
    }
  });
}

// altera informaçoes de compartilhamento da parceiria entre entidades
function changePartnerInfo(obj, entity_id, solicitation_id) {

  var type = null
          , entity_id
          , solicitation_id
          , value = null;
  type = $(obj).val();
  value = $(obj).is(':checked');
  var params = {type: type, entity_id: entity_id, solicitation_id: solicitation_id, value: value};
  $.ajax({
    url: '/entities/changepartnerinfo',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(jqXHR, success) {
      if (success == 'success') {
        showAlertGeneral('success', 'Alteração realizada com sucesso.');
        $(obj).parent().append('<span class="glyphicon glyphicon-ok green"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      } else {
        showAlertGeneral('danger', 'Erro ao requisitar servidor.');
        $(obj).parent().append('<span class="glyphicon glyphicon-remove red"></span>').delay(4000).queue(function(nxt) {
          $(this).find('span').fadeOut(1000);
          nxt();
        });
      }
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao alterar configurações de compartilhamento da parceria na Entidade',
        rota: '/entities/changepartnerinfo',
        data: params
      });
    }
  });
}

//FOI PARA O GENERAL.JS
// popula select de cidade com base no estado
//function getCitiesByState(obj, cityfield) {
//  if ($('#' + cityfield).length === 1) {
//    $('#' + cityfield).html('<option>Carregando...</option>');
//    $.ajax({
//      url: '/cities/getcitiesbystate',
//      type: 'POST',
//      dataType: 'json',
//      data: {
//        state_id: $(obj).val()
//      },
//      success: function (resp) {
//        if (resp.status === 'success') {
//          $('#' + cityfield).html('<option value="0">Selecione</option>');
//          $.each(resp.data, function (index, city) {
//            $('#' + cityfield).append('<option value="' + city.id + '">' + city.name + '</option>');
//          });
//        } else {
//          $('#' + cityfield).html('<option>' + resp.message + '</option>');
//        }
//      },
//      error: function (response) {
//        return showResponseError(response);
//      }
//    });
//  }
//}

// filtra tela de blogs e grupos analytics / anuncios analytics
function analytics(obj) {
  if (obj.value !== '') {
    window.location = obj.value;
  }
}


// retorna posts relacionados
function getRelatedActivities(activity_id, timeline) {
  $('#show-related-' + activity_id).hide();
  $.ajax({
    url: '/activity/getrelatedsbyactivity',
    type: 'POST',
    data: {
      activity_id: activity_id,
      timeline: timeline
    },
    success: function(response) {
      if (response.status == 'success') {
        $('#releated-posts-' + activity_id).html(response.html).fadeIn(2000);
      }
    },
    error: function(response) {
      // se der erro neste caso não deve fazer nada mesmo.
      console.log(response);
      return false;
    }
  });
}

// executa ação de adicionar hashtags
function actionHashtag(obj) {
//  console.log('call add hashtag');
  hashtag = $(obj).val();
  if (hashtag != undefined && hashtag != '') {
    addHashtag(obj, hashtag);
//    console.log(hashtag);
  }
  $(obj).val('');
}

// adiciona uma hashtag ao post (GUI) e busca sugestões
function addHashtag(obj, hashtag) {
  if (hashtag.indexOf('#'))
    hashtag = '#' + $.trim(hashtag).replace('Carregando...', '');
  var rgxHashtag = /(?:\s|^)(?:#(?!(?:\d+|\w+?_|_\w+?)(?:\s|$)))(\w+)(?=\s|$)/i;
  rgxHashtag = new RegExp(rgxHashtag);
  resultRgxHashtag = rgxHashtag.test(hashtag);
  if (resultRgxHashtag == true) {
    if ($.inArray(hashtag, hashtagList) == -1) {
      hashtagList.push(hashtag);
      resultHashtag = hashtagList.join(',');
      $('#tags').val(resultHashtag);
      $('ul#box-hashtag').append('<li class="item-hashtag"><a href="/search/' + hashtag.replace(/#/, '%23') + '">' + hashtag + '</a></li>');
      if ($('#save-hashtag-post-public').length > 0) {
        $('#save-hashtag-post-public').show().html('Salvar');
      }
      getHashtagRelations();
    }
  }
}

// buscas hashtags relacionadas a uma em questão
function getHashtagRelations() {
  $.ajax({
    url: '/activity/relatedhashtags',
    data: {hashtag: hashtag},
    dataType: 'html',
    contentType: 'text/html; charset=utf-8',
    complete: function(jqXHR, status) {
      if (status == 'success') {
        var hashtags = JSON.parse(jqXHR.responseText);
        if (hashtags.length > 0) {
          for (var i = 0; i < hashtags.length; i++) {
            if ($.inArray(hashtags[i], hashtagList) == -1 && $.inArray(hashtags[i], relatedHashtags) == -1) {
              relatedHashtags.push(hashtags[i]);
              $('#related-hashtags').fadeIn();
              $('#related-hashtags ul').append('<li class="related-hashtag"><a href="#" title="Adicionar ' + hashtags[i] + ' a publicação">' + hashtags[i] + '</a></li>');
            }
          }
        }
      }
    }
  });
}

// remove uma hashtags da listagem de hashtags de classificação de posts
function removeHashtag(hashtag) {
  hashtag = $.trim(hashtag);
  var resultHashtag = '';
  if ($.inArray(hashtag, hashtagList) >= 0) {
    hashtagList.splice(hashtagList.indexOf(hashtag), 1);
    resultHashtag = hashtagList.join(',');
    $('#tags').val(resultHashtag);
  }
  return false;
}

// Função que apaga qualquer notificação de uma atividade
function hideNotificationOfferDemand(activity_id) {
  $('#container-notifications-activity-' + activity_id).html('');
}

// Função que apresenta alert de cancelamento de Atividades na Timeline
function showFormDeleteOfferDemand(entity, activity_id) {
  var html =
          '<div class="alert alert-warning" >' +
          '<button type="button" class="close" onclick="hideNotificationOfferDemand(' + activity_id + ')">' +
          '  <span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
          '</button>' +
          'Deseja realmente apagar esta publicação?' +
          '<form action="' + entity + '/config/offerdemandremove" method="post" id="' + activity_id + '_delete" class="post-delete">' +
          '<input type="hidden" value="' + activity_id + '" name="id"/>' +
          '<button type="submit" class="apagar btn btn-xs btn-warning" title="Apagar">Apagar</button>' +
          '</form>' +
          '</div>';
  $('#container-notifications-activity-' + activity_id).html(html);
}

// Função para tratar url de imagens
function avatar(url) {
  if (!url) {
    return url;
  }
  if (url.substr(0, 4) == 'http') {
    return url;
  } else {
    return  portal.media_server + (url.charAt(0) !== '/' ? '/' + url : url);
  }
}

function searchListUrl(slug, type, domain) {
  if (type == 'ciranda') {
    return domain;
  } else if (type == 'blog' || type == 'grupo') {
    return '/blogs/redirect/slug/' + slug;
  } else if (type == 'perfil') {
    return '/user/' + slug;
  } else {
    return '/';
  }
}

// Função submit da busca
function search(object, data) {
  if (data !== '') {
    var url = '/search/' + encodeURIComponent(data);
    if ($('#active-entity').length > 0 && $('#active-entity').val() !== '') {
      url = $('#active-entity').val() + url;
    }
    window.location = url;
  }
}

// Função submit da busca
function publicSearch(object, data) {
  if (data !== '')
    window.location = $(object).attr('action') + '/' + data;
  return false;
}


// Vai para pagina da ciranda selecionada mantendo a busca, caso exista.
function goEntityPage(obj) {
  var newUri = '';
  if ($(obj).attr('data_slug') != '') {
    newUri = $(obj).attr('data_slug');
  }
  if ($('#input_busca').val() != '') {
    newUri = newUri + '/search/' + $('#input_busca').val();
  }
  window.location.replace(newUri ? newUri : '/');
}

/**
 * Convert number of bytes into human readable format
 *
 * @param integer bytes     Number of bytes to convert
 * @param integer precision Number of digits after the decimal separator
 * @return string
 */
function bytesToSize(bytes, precision)
{
  var kilobyte = 1024;
  var megabyte = kilobyte * 1024;
  var gigabyte = megabyte * 1024;
  var terabyte = gigabyte * 1024;
  if ((bytes >= 0) && (bytes < kilobyte)) {
    return bytes + ' B';
  } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
    return (bytes / kilobyte).toFixed(precision) + ' KB';
  } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
    return (bytes / megabyte).toFixed(precision) + ' MB';
  } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
    return (bytes / gigabyte).toFixed(precision) + ' GB';
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + ' TB';
  } else {
    return bytes + ' B';
  }
}

// executa a filtragem mantendo a busca avançada
function executeAdvanceSearch(obj, form) {
  if ($("form#" + form).length > 0) {
    $("form#" + form).attr('action', $(obj).attr('href'));
    $("form#" + form).removeAttr('enctype');
    $("form#" + form).submit();
  } else {
    window.location.replace($(obj).attr('href'));
  }
  return false;
}

// altera periodo em busca avançada
function changePeriodAdvancedSearch(obj) {
  if ($(obj).val() == '--') {
    $('.form-text-created_at_begin').slideDown();
    $('.form-text-created_at_end').slideDown();
  } else {
    $('.form-text-created_at_begin').slideUp();
    $('.form-text-created_at_end').slideUp();
  }
  var date = $(obj).val().split('-');
  $('#created_at_begin').val(date[0]);
  $('#created_at_end').val(date[1]);
}


function duplicateActivity(activityId) {
  $.ajax({
    url: '/blogs/mygroups',
    type: 'GET',
    data: {activityId: activityId},
    beforeSend: function() {
      //loading
    },
    complete: function(jqXHR, status) {
      if (status = 'success') {
        var groups = JSON.parse(jqXHR.responseText);
        var groupList = '<ul class="groups-duplicate-list"></ul>';
        if (groups.length > 0) {
          groups.forEach(function(group) {
            var groupLink = '' +
                    '<li>' +
                    '  <a href="javascript:" class="userListLike" ' +
                    '    onclick="duplicateActivityOnGroup(' + activityId + ', ' + group.id + ')">' +
                    '    <span>' + group.title + '</span>' +
                    '  </a>' +
                    '</li>';
            groupList = groupList.replace('</ul>', groupLink + '</ul>');
          });
        } else {
          var groupLink = '' +
                  '<li>' +
                  '  <a href="javascript:" class="userListLike">' +
                  '    <span>Você não está participando de nenhum grupo.</span>' +
                  '  </a>' +
                  '</li>';
          groupList = groupList.replace('</ul>', groupLink + '</ul>');
        }
        showModal('Grupo a ser duplicada a atividade', groupList);
      } else {
        showAlertGeneral('danger', 'Erro ao requisitar servidor');
      }
    }
  });
}

function duplicateActivityOnGroup(activityId, blogId) {
  $('#modal').hide();
  var params = {
    activityId: activityId,
    blogId: blogId
  };
  $.ajax({
    url: '/activity/duplicate',
    type: 'POST',
    data: params,
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        showAlertGeneral('success', response.message);
      }
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao duplicar atividade',
        rota: '/activity/duplicate',
        data: params
      });
    },
    complete: function(response) {
      hideModal();
    }
  });
}

// oculta o modal na tela
function hideModal() {
  $('#modal').modal('hide');
}

// apresenta o modal na tela
function showModal(title, body) {
  $('#modal .modal-title').html(title);
  $('#modal .modal-body').html(body);
  $('#modal').modal();
}

// BALÃO DO FIVEICON NAS ABAS
function iconBubble(action) {
  var alert_conversations = $('.alert_conversations');
  var alert_global = $('.alert_global');
  var messages = alert_conversations.html() * 1;
  var global = alert_global.html() * 1;
  if (action == 'reset') {
    global = 0;
  }
  if (messages == 0) {
    alert_conversations.hide();
  } else {
    alert_conversations.show();
  }

  if (global == 0) {
    alert_global.hide();
  } else {
    alert_global.show();
  }
  var bubble = messages + global;
  Tinycon.setBubble(bubble);
}

// CROP DE IMAGENS
function arquivo_preview(img, selection) {
  var previewX = $('#arquivo_preview_croped').width();
  var previewY = $('#arquivo_preview_croped').height();
  var scaleX = previewX / (selection.width || 1);
  var scaleY = previewY / (selection.height || 1);
  var imageX = img.width;
  var imageY = img.height;
  $('#arquivo_preview_croped > img').css({
    width: Math.round(scaleX * imageX) + 'px',
    height: Math.round(scaleY * imageY) + 'px',
    marginLeft: '-' + Math.round(scaleX * selection.x1) + 'px',
    marginTop: '-' + Math.round(scaleY * selection.y1) + 'px'
  });
}
// CROP DE IMAGENS
function arquivo_previewXY(img, selection) {
  var largura = selection.x2 - selection.x1;
  var altura = selection.y2 - selection.y1;
  $("#avatar, #image_dimension").val("");
  var data = {
    size: largura + 'x' + altura,
    position: selection.x1 + 'x' + selection.y1
  };
  $("#avatar, #image_dimension").val(JSON.stringify(data));
}

// realiza truncate nas atividade na timeline
function truncateActivity(obj) {
  if (typeof obj == 'undefined') {
    obj = $('#ciranda-content');
  }
  $('.truncate', obj).dotdotdot({
    after: 'a.readmore'
  });
}

function realoadCaptcha(img, field_id) {
  $.ajax({
    url: '/activity/newcaptcha',
    type: 'POST',
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        $('#' + img).html(response.data.html);
        $('#' + field_id).val(response.data.id);
      }
    }
  });
}

function commentguest(object, post) {
  $.ajax({
    url: $(object).attr('action'),
    type: 'POST',
    data: $(object).serialize(),
    dataType: 'json',
    success: function(response) {
      if (response.status == 'success') {
        showAlertGeneral('success', response.message, '#messagesCommentGuest');
        $('#commentguest_name').val('');
        $('#commentguest_email').val('');
        $('#commentguest_value').val('');
        $('#field_captcha_comment').val('');
        $('.comments').append(response.data);
        realoadCaptcha('captcha_comment', 'id_field_captcha');
      }
    },
    error: function(response) {
      try {
        var response = response.responseText;
        response = JSON.parse(response);
        showAlertGeneral('danger', response.message);
        realoadCaptcha('captcha_comment', 'id_field_captcha');
      } catch (exception) {
        return false;
      }
    }
  });
  return false;
}


// Função que marca qual melhor resposta
function setBestAnswer(object, comment_id, activity_id) {
  $.ajax({
    url: $(object).attr('action'),
    type: 'POST',
    data: $(object).serialize(),
    dataType: 'json',
    success: function(response) {
      $('.comment_activity_' + activity_id).removeClass('best_answer');
      $('#comment_' + comment_id).addClass('best_answer');
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao marcar melhor resposta',
        rota: $(object).attr('action'),
        data: $(object).serialize()
      });
    }
  });
}

//funcões para tratamento de áreas de interesse na publicação de atividades
//popula ao de disponiveis com áreas do usuário
function populateAvaliableInterestAreaActivity() {
  if ($('#interest-areas-profile').length > 0 && $('#interest-areas-profile').val().length > 0) {
    $('#avaliable-interest-areas-activity').html('');
    var interests = $('#interest-areas-profile').val().split(',');
    interests.sort();
    $.each(interests, function(index, value) {
      if (value) {
        addInterestAreaAvaliableToActivityElementLI(value);
      }
    });
//    $('#interest-areas-subtitle-selected').hide();
    $('#selected-interest-areas').html('');
    $('.interest_areas').val('');
  }
  if ($('#interest-areas-top').length > 0 && $('#interest-areas-top').val().length > 0) {
    $('#top-interest-areas-activity').html('');
    var interests = $('#interest-areas-top').val().split(',');
    interests.sort();
    $.each(interests, function(index, value) {
      if (value) {
        addInterestAreaTopToActivityElementLI(value);
      }
    });
//    $('#interest-areas-subtitle-selected').hide();
    $('#selected-interest-areas').html('');
    $('.interest_areas').val('');
  }
}
//cria elemento ele na sessão de disponíveis
function addInterestAreaAvaliableToActivityElementLI(value) {
  value = value.toLowerCase();
  $('#avaliable-interest-areas-activity').append(
          '<li id="interest-area-avaliable-' + value + '" onclick="addInterestAreaActivity(this, \'' + value + '\')">' +
          '<span>' + value + '</span>' +
          '<span class="glyphicon glyphicon-chevron-down"></span>' +
          '</li>'
          );
  $('#interest-areas-subtitle-avaliable-label').show();
}
//cria elemento ele na sessão de disponíveis de top areas
function addInterestAreaTopToActivityElementLI(value) {
  value = value.toLowerCase();
  $('#top-interest-areas-activity').append(
          '<li onclick="addInterestAreaActivity(this, \'' + value + '\')">' +
          '<span>' + value + '</span>' +
          '<span class="glyphicon glyphicon-chevron-down"></span>' +
          '</li>'
          );
  $('#interest-areas-subtitle-avaliable-label').show();
}
//seleciona área para a publicação
function addInterestAreaActivity(obj, value) {
  value = value.trim();
  value = value.toLowerCase();
  var currentAreas = $('.interest_areas').val();
  if (!currentAreas.match(value + ',')) {
    $('.interest_areas').val($('.interest_areas').val() + value + ',');
    addInterestAreaActivityElementeLI(value);
    if (obj) {
      $(obj).remove();
    }
//    $('#interest-areas-subtitle-selected').show();
    if ($('#avaliable-interest-areas-activity li').length == 0) {
      $('#interest-areas-subtitle-avaliable-label').hide();
    }
  }
}
//cria elemento li na sessão de áreas selecionadas
function addInterestAreaActivityElementeLI(value) {
  value = value.toLowerCase();
  $('#selected-interest-areas').append(
          '<li onclick="removeInterestAreaActivity(this, \'' + value + '\')">' +
          '<span>' + value + '</span>' +
          '<span class="glyphicon glyphicon-remove"></span>' +
          '</li>'
          );
}
//remove uma area de intersse seleciona no form de atividade
function removeInterestAreaActivity(obj, value) {
  $(obj).remove();
  $('.interest_areas').val($('.interest_areas').val().replace(value + ',', ''));
  addInterestAreaAvaliableToActivityElementLI(value);
}
//funcção que apresenta form de cadastro de área de interesse 
function showformInterestAreaActivity() {
  // adiciona o autocomplete
  $('#showInterestAreaForm').fadeOut(function() {
    $('#form-add-interest-areas').fadeIn();
  });
  $('#new_interest_area').focus();
}
;

//função que cadastra uma nova área de interesse  
function addInterestArea(form) {
  if (typeof form === 'string') {
    var params = {'interest_area': form}
  } else {
    var params = $(form).serialize();
  }

  $.ajax({
    url: '/profiles/addinterestarea',
    type: 'POST',
    data: params,
    success: function(response) {
      if (response.status == 'success') {
        $('#interest-areas-profile').val($('#interest-areas-profile').val() + response.data.interest_area + ',');
        $('#new_interest_area').val('');
        addInterestAreaAvaliableToActivityElementLI(response.data.interest_area);
        profileSocket.interestAreas.push(response.data.interest_area);
        if (typeof form !== 'string') {
          showformInterestAreaActivity();
        }
        ;
      }
    },
    error: function(response) {
      $('#new_interest_area').focus();
      showResponseError(response, null, {
        subject: 'Erro ao adicionar nova área de interesse',
        rota: '/profiles/addinterestarea',
        data: $(form).serialize()
      });
    }
  });
  return false;
}

//função que apresenta o modal para denunciar uma atividade ou comentário
function showDenounceForm(type, id) {
  var html =
          '<div id="messages-denounce" class="alert" style="display: none;"></div>' +
          '<form action="/flow/denounce" method="post" onsubmit="denounce(this); return false;" class="twitter_form">' +
          '<input type="hidden" name="' + (type === 'activity' ? 'activity_id' : 'comment_id') + '" value="' + id + '">' +
          '<div class="form-group">' +
          '<label class="radio"><input type="radio" name="type" value="not_related" class="radiobutton" /> Não esta relacionado a(s) área(s) de interesse</label>' +
          '<label class="radio"><input type="radio" name="type" value="spam" class="radiobutton" />É spam</label>' +
          '<label class="radio"><input type="radio" name="type" value="pornography" class="radiobutton" />É pornografia</label>' +
          '<label class="radio"><input type="radio" name="type" value="offensive" class="radiobutton" />É ofensivo</label>' +
          '</div>' +
          '<div class="form-actions">' +
          '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" />' +
          '<input type="submit" class="btn btn-info" value="Denunciar" />' +
          '</div>' +
          '</form>';
  showModal('Por que você deseja denunciar ' +
          (type === 'activity' ? 'esta publicação' : 'este comentário') + '?', html);
}

//função que executa rota para denuncia de atividade ou comentário
function denounce(form) {
  $.ajax({
    url: '/flow/denounce',
    type: 'POST',
    data: $(form).serialize(),
    success: function(response) {
      if (response.status == 'success') {
        $('#modal').modal('hide');
        showAlertGeneral('success', response.message);
      }
    },
    error: function(response) {
      showResponseError(response, '#messages-denounce', {
        subject: 'Erro ao denunciar atividade/comentário',
        rota: '/flow/denounce',
        data: $(form).serialize()
      });
    }
  });
  return false;
}

//função que apresentar confirmação para exclusão de atividade nas moderações e no admin
function showModalConfirmationRemoveActivity(activity_id, value) {
  var html =
          '<div id="messages-modal" class="alert" style="display: none;"></div>' +
          value +
          '<form action="/activity/delete" method="post" onsubmit="removeRegistry(this, \'' + activity_id + '\', \'#messages-modal\'); ' +
          'return false;" class="twitter_form">' +
          '<input type="hidden" value="' + activity_id + '" name="activity_id"/>' +
          '<div class="form-actions">' +
          '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" />' +
          '<input type="submit" class="btn btn-info" value="Apagar" />' +
          '</div>' +
          '</form>';
  showModal('Deseja realmente apagar esta publicação?', html);
}
//função ignorar denuncias
function ignoreDenounce(field, id) {
  var data = {};
  data[field] = id;
  $.ajax({
    url: '/flow/ignoredenounces',
    type: 'POST',
    data: data,
    success: function(response) {
      if (response.status == 'success') {
        $('#' + id).remove();
        showAlertGeneral('success', response.message);
      }
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao ignorar denúncias',
        rota: '/flow/ignoredenounces',
        data: data
      });
    }
  });
  return false;
}

//função que apresentar confirmação para exclusão de comentário nas moderações e no admin
function showModalConfirmationRemoveComment(comment_id, value) {
  var html =
          '<div id="messages-modal" class="alert" style="display: none;"></div>' +
          value +
          '<form action="/activity/deletecomment" method="post" id="' + comment_id + '_delete"' +
          '  onsubmit="removeRegistry(this, \'' + comment_id + '\'); return false;" class="twitter_form">' +
          '<input type="hidden" value="' + comment_id + '" name="comment"/>' +
          '<div class="form-actions">' +
          '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" />' +
          '<input type="submit" class="btn btn-info" value="Apagar" />' +
          '</div>' +
          '</form>';
  showModal('Deseja realmente apagar este comentário?', html);
}


//função genérica que pode ser utilizado para remover registros de um tabela
function removeRegistry(form, element_id, element_message) {
  $.ajax({
    url: $(form).attr('action'),
    type: 'POST',
    data: $(form).serialize(),
    success: function(response) {
      if (response.status == 'success') {
        $('#modal').modal('hide');
        $('#' + element_id).remove();
        showAlertGeneral('success', response.message);
      }
    },
    error: function(response) {
      showResponseError(response, element_message, {
        subject: 'Erro ao remover registro de uma tabela (função genérica)',
        rota: $(form).attr('action'),
        data: $(form).serialize()
      });
    }
  });
  return false;
}

function showFormDuplicateToSocial(activityId) {
  var html =
          '<div class="alert" id="messages-duplicate-to-social" style="display: none;"></div>' +
          '<div id="interest-areas-activity-content">' +
          '<span id="interest-areas-subtitle-avaliable" class="subtitle">' +
          '  <span id="interest-areas-subtitle-avaliable-label"><span class"sublabel">Minhas Áreas de Interesse:</span>' +
          '    <a title="Gerenciar Áreas de Interesse" href="/profiles/edit#newInterestAreas"><span class="glyphicon glyphicon-cog"></span></a>' +
          '  </span>' +
          '</span>' +
          '<ul id="avaliable-interest-areas-activity"></ul>' +
          '<span id="interest-areas-subtitle-selected" class="subtitle">' +
          '<span class="sublabel">Áreas selecionadas:</span>' +
          ' <a id="showInterestAreaForm" title="Adicionar Nova Áreas de Interesse" href="javascript:" onclick="showformInterestAreaActivity();"><span class="glyphicon glyphicon-plus"></span></a>' +
          ' <form id="form-add-interest-areas" action="post" onsubmit="insertNewInterestAreaInActivity(); return false;" style="display: none;">' +
          '  <div class="input-group">' +
          '    <input id="new_interest_area" type="text" name="interest_area" class="interest_area_atwho form-control">' +
          '    <span class="input-group-btn">' +
          '      <button class="btn btn-info" type="submit">Adicionar</button>' +
          '    </span>' +
          '  </div>' +
          ' </form>' +
          '</span>' +
          '<ul id="selected-interest-areas"></ul>' +
          '</div>' +
          '<form action="/activity/duplicate" method="post" class="twitter_form" onsubmit="duplicateToSocial(this); return false;">' +
          '<input type="hidden" name="activityId" value="' + activityId + '" />' +
          '<input type="hidden" name="flow" value="1" />' +
          '<input type="hidden" id="interest-areas-profile" value="' + profileSocket.interestAreas.join(',') + '" />' +
          '<input type="hidden" name="interest_areas" class="interest_areas" value="" />' +
          '<textarea name="value" class="activity-value atwho-value" style="width: 100%;" rows="2" placeholder="Deseja acrescentar algo?"></textarea>' +
          '<input type="hidden" name="mentions" value="" class="input-mentions">' +
          '<input type="hidden" name="hashtags" value="" class="input-hashtags">' +
          '<div class="form-actions">' +
          '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" />' +
          '<input type="submit" class="btn btn-info" value="Enviar" />' +
          '</div>' +
          '</form>';
  showModal('Selecione as áreas de interesse relacionadas a esta publicação!', html);
  populateAvaliableInterestAreaActivity();
  $('.interest_area_atwho').atwho({
    at: "",
    data: '/interestareas/autocomplete/',
    tpl: "<li data-value='${name}'>${name}</li>",
    limit: 15
  });
}

function duplicateToSocial(form) {
  $.ajax({
    url: '/activity/duplicate',
    type: 'POST',
    data: $(form).serialize(),
    success: function(response) {
      if (response.status == 'success') {
        showAlertGeneral('success', 'Publicação enviada com sucesso');
        hideModal();
      }
    },
    error: function(response) {
      showResponseError(response, '#messages-duplicate-to-social', {
        subject: 'Erro ao duplicar atividade para o Social',
        rota: '/activity/duplicate',
        data: $(form).serialize()
      });
    }
  });
  return false;
}

function insertNewInterestAreaInActivity() {
  console.log('Adicionando area de interessa na atividade');
  var obj = null;
  var value = $('#new_interest_area').val();
  value = value.trim().toLowerCase();
  if (value == '') {
    return false;
  }
  if ($('#interest-area-avaliable-' + value).length > 0) {
    obj = $('#interest-area-avaliable-' + value);
  }
  addInterestAreaActivity(obj, value);

  $('#form-add-interest-areas').fadeOut(function() {
    $('#showInterestAreaForm').fadeIn();
  });
  $('#new_interest_area').val('');
  setTimeout($('#new_interest_area').focus(), 3000);
  return false;
}

//INICIO funções filtro FLOW
function insertNewInterestAreaInFilter() {
  var obj = null;
  var value = $('#new_interest_area_filter').val();
  value = value.trim().toLowerCase();
  if (value == '') {
    return false;
  }
  addInterestAreaFilter(obj, value);
  $('#new_interest_area_filter').val('');
  setTimeout($('#new_interest_area_filter').focus(), 100);
  return false;
}
function addInterestAreaFilter(obj, value) {
  value = value.trim().toLowerCase();
  var currentAreas = $('#current_filter_interest_areas').val();
  if (!currentAreas.match(value + ',')) {
    $('#current_filter_interest_areas').val($('#current_filter_interest_areas').val() + value + ',');
    addInterestAreaFilterElementeLI(value);
    if (obj) {
      $(obj).remove();
    }
  }
}
function addInterestAreaFilterElementeLI(value) {
  value = value.toLowerCase();
  $('#interest-areas-filter').append(
          '<li onclick="removeInterestAreaFilter(this, \'' + value + '\')">' +
          '<span>' + value + '</span>' +
          '<span class="glyphicon glyphicon-remove"></span>' +
          '</li>'
          );
}
function populateCurrentInterestAreasFilter() {
  if ($('#current_filter_interest_areas').length > 0 && $('#current_filter_interest_areas').val().length > 0) {
    $('#interest-areas-filter').html('');
    var interests = $('#current_filter_interest_areas').val().split(',');
    interests.sort();
    $.each(interests, function(index, value) {
      if (value) {
        addInterestAreaFilterElementeLI(value);
      }
    });
  }
}
function removeInterestAreaFilter(obj, value) {
  $(obj).remove();
  $('#current_filter_interest_areas').val($('#current_filter_interest_areas').val().replace(value + ',', ''));
}
function saveFlowFilter() {
  $.ajax({
    url: '/flow/saveuserfilter',
    type: 'post',
    dataType: 'json',
    data: {
      filter: $('#type-flow-filter-all').is(':checked') ? '' : $('#current_filter_interest_areas').val()
    },
    beforeSend: function() {
      $('#btn-save-flow-filter').prop('disabled', true);
    },
    success: function(response) {
      showAlertGeneral('success', response.message);
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao salvar Filtro Flow',
        filter: $('#current_filter_interest_areas').val()
      });
    },
    complete: function() {
      $('#btn-save-flow-filter').prop('disabled', false);
    }
  });
  return false;
}

//-------------------FIM funções filtro FLOW

function uploadAvatar(idObj, id, type) {
  $parent = $('#' + idObj).parent();

  $parent.click(function(e) {
    e.stopPropagation();
    e.preventDefault();
  });

  $form = $("<form enctype='multipart/form-data'></form>");
  $input_file = $('<input type="file" name="file" value=""/>');
  $input_file.click();
  data = {id: id, type: type};
  console.log(data);

  $form.ajaxForm({
    url: '/upload/avatar',
    type: 'post',
    dataType: 'json',
    data: data,
    beforeSend: function() {
      $('.ciranda-loading', $parent).show();
    },
    success: function(responseText, statusText, xhr, $form) {
      var oldAvatar = $('#' + idObj).parent().children('img').attr('src');
      //$('#' + idObj).parent().children('img').attr('src', responseText.data.url);
      $('img[src="' + oldAvatar + '"]').attr('src', responseText.data.url);
    },
    error: function(xhr, statusText, error) {
      try {
        var json = $.parseJSON(xhr.responseText);
        showAlertGeneral('danger', json.message);
      } catch (e) {
        showAlertGeneral('danger', 'Ocorreu um erro inesperado. O mesmo será corrigido o mais rápido possível, tente novamente mais tarde.')
      }
    },
    complete: function(xhr) {
      $('.ciranda-loading', $parent).hide();
    }
  });

  $input_file.change(function() {
    $form.append($input_file);
    $form.trigger('submit');
  });

}

function updateMediaPreview() {
  $('.activity-link-page').not('.already-updated').each(function() {
    var $self = $(this);
    var $img = $self.find('.wrap-image img');
    $('<img/>').attr('src', $img.attr('src')).load(function() {
      $self.addClass('already-updated');
      if (this.width < 40 || this.height < 40)
        return;
      $img.show();
      if (this.width < 430) {
        $('.wrap-image', $self).attr('class', 'col-lg-4 col-md-4 col-sm-4 col-xs-12 wrap-image');
        $('.page-data', $self).attr('class', 'col-lg-8 col-md-8 col-sm-8 col-xs-12 page-data atc_info');
      }
    });
  });
}

function redirectSelect(obj) {
  if (obj.value !== '') {
    window.location = obj.value;
  }
}

function requestPagseguroPayment(form) {
  $.ajax({
    url: '/' + portal.entity_slug + '/pagseguro/registerpaymentrequest',
    type: 'post',
    dataType: 'json',
    data: $(form).serialize(),
    beforeSend: function() {
      $('.btn_buy').prop('disabled', true);
      $('.btn_buy').hide();
      $('.loading_request_pagseguro').show();
    },
    success: function(response) {
      if (response.status == 'success') {
        window.location = response.data.url_pagseguro;
      }
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao requisitar pagamento do PagSeguro',
        rota: '/' + portal.entity_slug + '/pagseguro/registerpaymentrequest',
        data: $(form).serialize()
      });
      $('.btn_buy').prop('disabled', false);
      $('.btn_buy').show();
      $('.loading_request_pagseguro').hide();
    }
  });
  return false;
}

function selectRoleChange(obj) {
  $('.fieldset_permissions_role').slideUp();
  $('#fieldset-permissions_' + $(obj).val()).slideDown();
}

function publishActivity(activity_id) {
  $.ajax({
    url: '/activity/publishactivity',
    method: 'post',
    data: {
      activity_id: activity_id
    },
    dataType: 'json',
    success: function(res) {
      if (res.status == 'success') {
        showAlertGeneral('success', res.message);
        $('.alert-draft-scheduled-' + activity_id).hide();
      }
    },
    error: function(res) {
      showResponseError(res, null, {
        subject: 'Erro ao publicar atividade',
        rota: '/activities/publishactivity',
        activity_id: activity_id
      });
    }
  });
}

function showChangeUsernameForm() {
  var html =
    '<div class="alert alert-warning"><p><strong>Atenção</strong>, a auteração do username pode ser realizada apenas uma vez!<br>E a mesma não poderá ser desfeita!</p></div>' +
    '<div class="alert" id="messages-changeusername" style="display: none;"></div>' +
    '<ul id="selected-interest-areas"></ul>' +
    '</div>' +
    '<form action="/profiles/changeusername" method="post" class="twitter_form" onsubmit="changeUsername(this); return false;">' +
    '<label for="input-username">Novo Username</label>' +
    '<input id="input-username" type="text" name="username" value="" class="input form-control">' +
    '<div class="form-actions">' +
    '<input type="button" class="btn btn-danger" onclick="hideModal();" value="Cancelar" />' +
    '<input type="submit" class="btn btn-info" value="Enviar" />' +
    '</div>' +
    '</form>';
  showModal('Alteração de username:', html); 
}

function changeUsername(form) {
  $.ajax({
    url: '/profiles/changeusername',
    type: 'POST',
    data: $(form).serialize(),
    success: function(response) {
      if (response.status == 'success') {
        showAlertGeneral('success', 'Username alterado com sucesso');
        $('#username-profile').val($('#input-username').val());
        $('#input-group-btn-change-username').remove();
        hideModal();
      }
    },
    error: function(response) {
      showResponseError(response, '#messages-changeusername', {
        subject: 'Erro ao alterar o username',
        rota: '/profiles/changeusername',
        data: $(form).serialize()
      });
    }
  });
  return false;
}

function showUsersClickedLink(activity_id, link, text, period) {
  $.ajax({
    url: '/activity/getusersclickedlink',
    type: 'POST',
    dataType: 'json',
    data: {
      activity_id: activity_id, 
      link: link,
      text: text,
      period: period
    },
    success: function(response) {
      var html = '';
      var profileClick = response.users;
      if (profileClick.length > 0) {
        html = '<ul class="user-list-like">';
        for (var i = 0; i < profileClick.length; i++) {
          html += '<li><a href="/user/' + profileClick[i].username + '">';
          html += '<img class="img-circle" src="' + profileClick[i].avatar + '"/>';
          html += '<span>' + profileClick[i].name + '</span>';
          html += '</a></li>';
        }
        html += '</ul>';
      } else {
        html+= "<div class='alert alert-info'>Todos os clicks registrados foram realizados por visitantes (usuário não logados).</div>";
      }
      showModal("Usuários que clicaram.", html);
    },
    error: function(response) {
      return false;
    }
  });
}

function mostraPostCompleto(){
  $(".dotdot_post").hide();
  $(".post_completo").show();
  return false;
}

function showConfirmRemove(link) {
  var html =
    '<center><a class="btn btn-default" title="Cancelar" onclick="hideModal();">Cancelar</a>' +
    '<a class="btn btn-danger" href="' + link + '" style="margin-left: 10px;">Excluir</a>';
  showModal('Deseja realmente excluir este registro?', html);
}

function pollClose(activity_id){
  $.ajax({
    url: '/stack/stack/close',
    type: 'POST',
    data: { id: activity_id },
    success: function(data) {
      console.log(data);
      if (!data.error) {
        showAlertGeneral('success', 'Enquete encerrada, você será redirecionado');
        window.location.href = data.link;
      } else {
        $('.message-alert').html('<span class="message-error">' + data.error + '</span>');
        showResponseError(data.error, null, {
          subject: 'Erro ao encerrar enquete',
          rota: '/stack/stack/close',
          data: activity_id
        });
      }
    },
    error: function(response) {
      showResponseError(response, null, {
        subject: 'Erro ao encerrar enquete',
        rota: '/stack/stack/close',
        data: activity_id
      });
    }
  });
}
function showFormLottery(activity_id){
  var html =
        '<div class="alert alert-info" >' +
        '<button type="button" class="close" onclick="hideNotificationActivity(' + activity_id + ')">' +
        '  <span aria-hidden="true">&times;</span><span class="sr-only">Close</span>' +
        '</button>' +
        'Preencha os campos abaixo para fazer o sorteio<br/>' +
        '<form class="activity-lottery" onsubmit="return false;">' +
          '<input type="hidden" name="activity_id" value="' + activity_id + '"/>' +
          '<div class="form-group">' +
          '<label>Prêmio</label>' +
          '<input type="text"  class="form-control" name="description"/>' +
          '</div>' +
          '<div class="form-group">' +
          '<label>Quantidade</label>' +
          '<input type="number"  class="form-control" name="number"/>' +
          '</div>' +
          '<button type="submit" class="apagar btn btn-sm btn-success" title="Sortear">Sortear</button>' +
        '</form>' +
        '</div>';
  $('#container-notifications-activity-' + activity_id).html(html);
}

$(document).on('submit','.activity-lottery',function(e){
  e.preventDefault();
  var form = $(this);
  var activity_id = $('input[name="activity_id"]',form).val();
  $('button',form).attr('disabled',true).html('Sorteando...');
  console.log('Lottery submit');
  $.ajax({
    url: '/activity/lottery',
    type: 'POST',
    data: form.serialize(),
    success: function(data) {
      console.log(data);
      $('#activity_' + activity_id + ' .lottery').html(data.html);
      $('#container-notifications-activity-' + activity_id).slideUp().html('').show();
    },
    error: function(response) {
      console.log(response);
      showResponseError(response, null, {
        subject: 'Erro ao encerrar enquete',
        rota: '/stack/stack/close',
        data: activity_id
      });
      $('button',form).attr('disabled',false).html('Sortear');
    }
  });
  return false;
})