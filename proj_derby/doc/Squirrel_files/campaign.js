/***************************************/
/********     CAMPANHAS  ***************/
/***************************************/
/*
 * JS com tratamentos para tela de criação de campanhas
 * 
 */
$(document).ready(function(){
  if ($("#total-profiles-reached-chart").length > 0 ) {
    if (totalProfilesReached === null){
      updateChartTotalProfilesReached(totalProfiles); 
    } else {
      updateChartTotalProfilesReached(totalProfilesReached);            
    }
  }
  $('input[name="layout"]').click(function(){
    $(".examples_layout").hide();
    $("#layout_" + $(this).val()).show();
  });
  //aba 2 =  camapanha
  function validateTabCampain(){
    var result = true;
    if (!$('#title').val()) {
      showAlertGeneral('danger', 'Informe o título');
      $('#title').focus();
      result = false;
    } else if (!$('#link').val()) {
      showAlertGeneral('danger', 'Informe o Link');
      $('#link').focus();
      result = false;
    } else if (!$('#message').val()) {
      showAlertGeneral('danger', 'Informe a Mensagem');
      $('#message').focus();
      result = false;
    }
    return result;
  }
  //aba 1 = seleção de usuários
  if ($("#blogs-campaign").length > 0) {
    execAutocomplete($("#blogs-campaign"), "blogs-campaign-id", "/blogs/autocomplete", '{"entity_id": "' + portal.entity_id + '"}');
  };
  $('body').on('keydown', '.newInterestAreasCampaigns', function (e) {
    var obj = $(this);
    if (e.which == 13 || e.which == 9 || e.which == 188) { //enter, tab, virgula
      console.log('executou do campaigns');
      updateTotalProfilesReached();
      return false;
    }
  }).on('paste', '.newInterestAreasCampaigns', function (e) {
    var obj = $(this);
    setTimeout(function () {
      updateTotalProfilesReached();      
      return false;
    }, 100);
  });

  //adiciona produtos, cidade e estados aos filtros
  $('.btn-add-item-campaign').click(function(){
    var type = $(this).attr('data-type');
    
    if (!$('#' + type + '-campaign-id').val()) {
      showAlertGeneral('danger', 'Selecione ' + $(this).attr('data-label'));
      $('#' + type + '-campaign').focus();
      return false;
    }
    $('#' + type + '-campaign-ids').val($('#' + type + '-campaign-ids').val() + $('#' + type + '-campaign-id').val() + ',');
    
    var html = '<li id="' + type + '-item-' + $('#' + type + '-campaign-id').val() + '" class="' + type + '-campaign">';
    html += $('#' + type + '-campaign').val();
    html += '<span class="glyphicon glyphicon-remove btn-remove-item-campaign" id="removeitem-' + $('#' + type + '-campaign-id').val() + '" data-type="' + type + '"></span>';
    html += '</li>';
    $('ul#' + type + '-campaign-selecteds').append(html);
    
    $('#' + type + '-campaign-id').val('');
    $('#' + type + '-campaign').val('');
    
    updateTotalProfilesReached();
  });
  //remove produtos, cidade e estados dos filtros
  $('#ciranda-container').on('click', '.btn-remove-item-campaign', function(){
    var type = $(this).attr('data-type');
    var idremove = $(this).attr('id').split('-')[1];
    $('#' + type + '-item-' + idremove).remove();
    var ids = $('#' + type + '-campaign-ids').val();
    $('#' + type + '-campaign-ids').val(ids.replace(idremove + ',', ''));
    
    updateTotalProfilesReached();
  });
  
  $('#sendtoemail').click(function(){
    if ($(this).is(":checked")) {
      $('#layouts_for_email').show();
    }
  });
  $('#sendtocellphone, #sendtoboth').click(function(){
    if ($(this).is(":checked")) {
      $('#layouts_for_email').hide();
      $('#layoutdefault').trigger('click');
    }
  });
  
  if ($('#campaign_html').length > 0) {
    CKEDITOR.replace('campaign_html', {
      customConfig: '/plugins/ckeditor/config-advanced.js'
    });
  }
  
  //wizard em modo geral
  $('#rootwizard').bootstrapWizard({
    onNext: function(tab, navigation, index) {
    },
    onTabChange: function(activeTab, navigation, currentIndex, nextTab) {
      if (nextTab == 2) {
        if ( $('#layouthtml').is(":checked") ) {
          $('#fields_layout_default').hide();
          $('#fields_layout_html').show();          
        } else {
          $('#fields_layout_html').hide();
          $('#fields_layout_default').show();
        }
      }
    }, 
    onTabShow: function(tab, navigation, index) {
      var $total = navigation.find('li').length;
      var $current = index + 1;
      var $percent = ($current / $total) * 100;
      $('#rootwizard').find('.bar').css({width: $percent + '%'});

      // If it's the last tab then hide the last button and show the finish instead
      if ($current >= $total) {
        $('#rootwizard').find('.pager .next').hide();
        $('#rootwizard').find('.pager .finish').show();
        $('#rootwizard').find('.pager .finish').removeClass('disabled');
      } else {
        $('#rootwizard').find('.pager .next').show();
        $('#rootwizard').find('.pager .finish').hide();
      }
    }
  });
  $('#rootwizard .finish').click(function() {
    $('#value_campaign_html').val(CKEDITOR.instances.campaign_html.getData());    
    $.ajax({
      url: '/' + portal.entity_slug + '/campaigns/save',
      type: 'POST',
      dataType: 'json',
      data: $('#campingsForm').serializeArray(),
      beforeSend: function() {
        $('#btn-finish-campaign').html('finalizando...').prop('disabled', true);
      },
      success: function(resp) {
        if (resp.status === 'success') {
          showAlertGeneral('success', resp.message);
          if (resp.shot) {
            showConfirmShot(resp.id, true);
          } else {
            location.href = '/' + portal.entity_slug + '/campaigns/index/campaign/' + resp.id;
          }
        }
      },
      error: function(response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          showAlertGeneral('danger', 'Ocorreu um erro inesperado');
          return false;
        }
      },
      complete: function() {
        $('#btn-finish-campaign').html('Finalizar').prop('disabled', false);
      }        
    });
  });

  // Upload banner campanha
  $("#image-campaign-button").click(function() {
    $("#image-campaign-upload").trigger('click');
  });
  if ($('#image-campaign-form').length > 0) {
    $('#image-campaign-form').ajaxForm({
      beforeSubmit: function(arr, $form, options) {
        $('#image-campaign-button').html('enviando...').prop('disabled', true);            
      },
      success: function(res) {
        if (res.status === 'error') {
          showAlertGeneral('danger', res.message);
          return false;
        }
        $('#image-campaign-link').val(res.url);
        $('#image-campaign-preview').attr('src', res.url);
        $('#loading-general').hide();
      },
      error: function(response) {
        try {
          var response = response.responseText;
          response = JSON.parse(response);
          showAlertGeneral('danger', response.message);
        } catch (exception) {
          showAlertGeneral('danger', 'Ocorreu um erro inesperado');
          return false;
        }
      },
      complete: function() { 
        $('#image-campaign-button').html('Selecionar Imagem').prop('disabled', false);            
      }
    });
  }
  $('#image-campaign-upload').change(function() {
    $('#image-campaign-form').submit();
  });  

  if ($('#campaing-shot-chart').length == 1) {
    $('#campaing-shot-chart').highcharts({
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: 0,
        plotShadow: false
      },
      colors: ['#0D233A', '#2F7ED8', '#2F78BB'],
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
            enabled: false
          },
          showInLegend: true,
        }
      },
      series: [{
        type: 'pie',
        data: [
          ['Não visualizados', campaignShotChart.email.totalNotViewedAndNotClicked], 
          ['Apenas visualizados', campaignShotChart.email.totalViewed], 
          ['Clicados', campaignShotChart.sms.totalViewedAndClicked]
        ],
        innerSize: '10%'
      }]
    });
  }

  if ($('#campaing-shot-chart-line').length == 1) {
    $(function() {
      // Register a parser for the American date format used by Google
      // Highcharts.Data.prototype.dateFormats['m/d/Y'] = {
      //   regex: '^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2})$',
      //   parser: function(match) {
      //     return Date.UTC(+('20' + match[3]), match[1] - 1, +match[2]);
      //   }
      // };
      var startCampaignShotViewedEmail = campaignShotChartLine.email.viewed[0]['0'].split('-');
      var  startCampaignShotClickedEmail = campaignShotChartLine.email.clicked[0]['0'].split('-');
      var  startCampaignShotClickedSms = campaignShotChartLine.sms.clicked[0]['0'].split('-');

      var dataChart = [];
      var colorsChart = [];

      if (campaignShotTypeEmail) {
        colorsChart.push('#0D233A', '#2F7ED8');
        dataChart.push({
          data: campaignShotChartLine.email.viewed,
          name: 'Emails visualizados',
          lineWidth: 2,
          marker: {
            radius: 3
          },
          pointStart: Date.UTC(1970, startCampaignShotViewedEmail[1] - 1, startCampaignShotViewedEmail[0]),
          pointInterval: 24 * 3600 * 1000
        },
        {
          data: campaignShotChartLine.email.clicked,
          name: 'Emails clicados',
          lineWidth: 2,
          marker: {
            radius: 3
          },
          pointStart: Date.UTC(1970, startCampaignShotClickedEmail[1] - 1, startCampaignShotClickedEmail[0]),
          pointInterval: 24 * 3600 * 1000
        });
      }
      
      if (campaignShotTypeSms) {
        colorsChart.push('#A4D53A');
        dataChart.push({
          data: campaignShotChartLine.sms.clicked,
          name: 'Sms clicados',
          lineWidth: 2,
          marker: {
            radius: 3
          },
          pointStart: Date.UTC(1970, startCampaignShotClickedSms[1] - 1, startCampaignShotClickedSms[0]),
          pointInterval: 24 * 3600 * 1000
        });
      }

      console.log(colorsChart);

      $('#campaing-shot-chart-line').highcharts({
        title: {
          text: '<br/>',
          margin: 50,
          useHTML: true
        },
        colors : colorsChart,
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
        series: dataChart
      });
    });
  }  

  $('#frequency').change(function() {
    $('#day_week').val(0);
    $('#day_month').val(1);
    $('#every_x_days').val(5);
    $('.frequency-option').hide();
    $('#' + this.value).parents('.frequency-option').show();
  });

  $('input[name$=\'shooting\']').change(function() {
    if (this.value == 'later') {
      $('#frequency').val('day_week');
      $('#hour').val(8);
      $('#frequency').change();
      $('#agendar-form').show();
    } else {
      $('#frequency').val('');
      $('#agendar-form').hide();
    }
  });
  
  $("#campaign_type").change(function() {
    if ( $(this).val() == "event" ) {
      $(".visible-when-event").show();
    } else {
      $(".visible-when-event").hide();      
    }
  });
  
  $("#btn-change-group-hashtags-role").click(function(){
    if ($(this).attr("data-value") == "and") {
      $(this).attr("data-value", "or");
      $(this).html("Qualquer hashtag");
      $(this).removeClass("btn-primary").addClass("btn-default");      
      $("#group_hashtags_role").val("or");
    } else {
      $(this).attr("data-value", "and");
      $(this).html("Todas hashtags");
      $(this).removeClass("btn-default").addClass("btn-primary");      
      $("#group_hashtags_role").val("and");      
    }
    updateTotalProfilesReached();
  });
  
  $("#group_hashtags_id, #last_days_hashtags").change(function(){
    updateTotalProfilesReached();    
  });
  
});

function updateTotalProfilesReached(){
  $.ajax({
    url: '/' + portal.entity_slug + '/campaigns/gettotalprofilesreached',
    type: 'POST',
    dataType: 'json',
    data: $('#campingsForm').serialize(),
    beforeSend: function() {
      $('#total-profiles-reached').html('<img src="/img/loading.gif">');
      $('#total-profiles-reached-withcellphone').html('<img src="/img/loading.gif">');
    },
    success: function(resp) {
      if (resp.status === 'success') {
        $('#total-profiles-reached').html(resp.data.total);
        $('#total-profiles-reached-withcellphone').html(resp.data.withcellphone);
        updateChartTotalProfilesReached(resp.data.total);
      } else {
        $('#total-profiles-reached').html('');        
        $('#total-profiles-reached-withcellphone').html('');
      }
    },
    error: function(){
      $('#total-profiles-reached').html('');
      $('#total-profiles-reached-withcellphone').html('');
    }
  });
}

function updateChartTotalProfilesReached(profilesReached){
  var totalR = profilesReached;
  var totalU = totalProfiles - profilesReached;
  
  totalR = (totalR * 100 / totalProfiles);
  totalU = (totalU * 100 / totalProfiles);
  
  $('#total-profiles-reached-chart').highcharts({
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: 0,
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
          enabled: false
        },
        showInLegend: true
      }
    },
    series: [{
        type: 'pie',
        data: [['Usuários não Selecionados', totalU], ['Usuários Identificados', totalR]],
        innerSize: '1%'
      }]
  });
}

function showConfirmShot(campaign_id, redirecty) {
  $.ajax({
    url: '/' + portal.entity_slug + '/campaigns/verifycreditsbeforeshot',
    type: 'POST',
    dataType: 'json',
    data: {
      campaign_id: campaign_id
    },
    beforeSend: function() {
    },
    success: function(response) {
      var html =
        '<div id="alert-shot" class="alert" style="display: none;">' +
        '</div>' +          
        '<center><a class="btn btn-danger" title="Cancelar" onclick="hideModal();">Cancelar</a>';
        if (response.show_buy) {
          html = html + '<a class="btn btn-success" href="' + response.link + '" style="margin-left: 10px;">Comprar Mais Cŕeditos</a>';
        }
        html = html + '<a class="btn btn-info" title="Disparar" onclick="shotCampaign(' + campaign_id + ', ' + redirecty + ');" style="margin-left: 10px;">Disparar</button></center>';
      showModal(response.message, html);
    },
    error: function(response){
      showResponseError(response);
    }
  });
}

function shotCampaign(campaignId, redirecty) {
  if (!campaignId) {
    showAlertGeneral('danger', 'Campanha não encontrada.');
    return false;
  }
  $.ajax({
    url: '/' + portal.entity_slug + '/campaigns/shot',
    type: 'POST',
    dataType: 'json',
    data: {
      campaign_id: campaignId
    },
    beforeSend: function() {
    },
    success: function(response) {
      if (redirecty) {
        location.href = '/' + portal.entity_slug + '/campaigns/index/';
      } else {
        showAlertGeneral(response.status, response.message);
        hideModal();
      }
    },
    error: function(response){
      showResponseError(response, '#alert-shot');
    }
  });
}
