$(document).ready(function(){
  
  $('.mask-date').inputmask("99/99/9999");
  $('.mask-time').inputmask("hh:mm");
  $('.mask-number').inputmask("99");
  
   //INICIO ARÉAS DE INTERESSE NO PERFIL DO USUÁRIO 
  if ($('#newInterestAreas').length > 0) {
    // adiciona áreas de interesse quando Enter ou tab
    $('body').on('keydown', '#newInterestAreas', function (e) {
      var obj = $(this);
      if (e.which == 13 || e.which == 9 || e.which == 188) { //enter, tab, virgula
        console.log('executou do general');
        addInterestAreaProfile($(obj).val());
        return false;
      }
    }).on('paste', '#newInterestAreas', function (e) {
      var obj = $(this);
      setTimeout(function () {
        addInterestAreaProfile($(obj).val());
        return false;
      }, 100);
    });

    // ao carregar a pagina quase o campo possua areas de interesse, cria os LI
    if ($('#interest_areas').length > 0 && $('#interest_areas').val().length > 0) {
      var interest = $('#interest_areas').val().split(',');
      interest.sort();
      $.each(interest, function (index, value) {
        if (value) {
          addInterestAreaProfileElementeLI(value);
        }
      });
    }
    // ao carregar a pagina quase o campo possua top areas de interesse, cria os LI
    if ($('#top_interest_areas').length > 0 && $('#top_interest_areas').val().length > 0) {
      var interests = $('#top_interest_areas').val().split(',');
      interests.sort();
      $.each(interests, function (index, value) {
        if (value) {
          addTopInterestAreaProfileElementeLI(index, value);
        }
      });
    }    
    // adiciona o autocomplete
    $('#newInterestAreas').atwho({
      at: "",
      data: '/interestareas/autocomplete/',
      tpl: "<li data-value='${name}'>${name}</li>",
      limit: 15
    });
  }
  //FIM ARÉAS DE INTERESSE NO PERFIL DO USUÁRIO 
 
  
});

// apresenta mensagem de notificação geral
function showAlertGeneral(status, message, obj, fixed) {
  if (!obj) {
    obj = "#alert-general";
  }
  if (fixed) {
    $(obj).removeClass('alert-success').removeClass('alert-info')
      .removeClass('alert-danger').addClass('alert-' + status + ' alert-dismissible')
      .html('<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">×</span><span class="sr-only">Fechar</span></button><p>' + message + '</p>')
      .slideDown(500);  
  } else {
    $(obj).removeClass('alert-success').removeClass('alert-info')
      .removeClass('alert-danger').addClass('alert-' + status)
      .html('<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">×</span><span class="sr-only">Fechar</span></button><p>' + message + '</p>')
      .slideDown(500).delay(5000).slideUp(500); 
  }
}

// trata response 400 ou 500 e apresenta erro padrao
function showResponseError(response, obj, info) {
  if (response.status == 0){
    return false;
  }
  try {
    response = JSON.parse(response.responseText);
    showAlertGeneral('danger', response.message, obj);
  } catch (exception) {
    if (info) {
      info.status = response.status;
      info.responseText = response.responseText;
      warnDevelopers(info);
      showAlertGeneral('danger', 'Ocorreu um erro inesperado. Os desenvolvedores foram notificados e corrigirão o problema o mais rápido possível. Obrigado pela compreensão.', obj);
    } else {
      showAlertGeneral('danger', 'Ocorreu um erro inesperado', obj);
    } 
    return false;
  }
}

function warnDevelopers(data) {
  $.ajax({
    url: '/api/status/error',
    type: 'post',
    dataType: 'json',
    async: true,
    data: data,
    success: function (response) {
      console.log('Desenvolvedores Notificados do Problema.');
    },
    error: function () {
      console.log('Erro ao notificar desenvolvedores!');
    }
  });
}

// popula select de cidade com base no estado
function getCitiesByState(obj, cityfield) {
  if ($('#' + cityfield).length === 1) {
    $('#' + cityfield).html('<option>Carregando...</option>');
    $.ajax({
      url: '/cities/getcitiesbystate',
      type: 'POST',
      dataType: 'json',
      data: {
        state_id: $(obj).val()
      },
      success: function (resp) {
        if (resp.status === 'success') {
          $('#' + cityfield).html('<option value="0">Selecione</option>');
          $.each(resp.data, function (index, city) {
            $('#' + cityfield).append('<option value="' + city.id + '">' + city.name + '</option>');
          });
        } else {
          $('#' + cityfield).html('<option>' + resp.message + '</option>');
        }
      },
      error: function (response) {
        return showResponseError(response);
      }
    });
  }
}

function addInterestAreaProfile(value) {
  var currentAreas = $('#interest_areas').val();

  value = value.trim().toLowerCase();
//  console.log(value);
  if (value.match(',')) {
    var newValues = value.split(',');
    var currentValues = currentAreas.split(',');
    var values = currentValues.concat(newValues);

    //remove duplicações
    var newValues = [];
    $.each(values, function (i, el) {
      if ($.inArray(el.trim(), newValues) === -1 && el.trim() != "")
        newValues.push(el);
    });

    $('#box-interestareas').html('');
    newValues.forEach(function (v) {
      addInterestAreaProfileElementeLI(v);
    });
    $('#interest_areas').val(newValues.join(','));

  } else {
    if (!currentAreas.match(value + ',')) {
      $('#interest_areas').val($('#interest_areas').val() + value + ',');
      addInterestAreaProfileElementeLI(value);
    }
  }
  $('#newInterestAreas').val('');
}

//funcões para tratamento de áreas de interesse no perfil do usuário
function addInterestAreaProfileElementeLI(value) {
  $('#box-interestareas').append(
    '<li>' + value +
    '<span onclick="removeInterestAreaProfile(this, \'' + value + '\')" class="glyphicon glyphicon-remove remove-interest-item"></span>' +
    '</li>'
    );
}

//funcões para tratamento de áreas de interesse no perfil do usuário
function addTopInterestAreaProfileElementeLI(obj, value) {
  $('#box-top-interestareas').append(
    '<li>' + value +
    '<span onclick="addTopInterestAreaProfile(this, \'' + value + '\')" class="glyphicon glyphicon-chevron-down add-interest-item"></span>' +
    '</li>'
    );
}

function removeInterestAreaProfile(obj, value) {
  $(obj).parent().remove();
  $('#interest_areas').val($('#interest_areas').val().replace(value + ',', ''));
  if ($(".newInterestAreasCampaigns").length > 0) {
    updateTotalProfilesReached();
  }
}

function addTopInterestAreaProfile(obj, value) {
  $(obj).parent().remove();
  addInterestAreaProfile(value);
}