$(document).on('click', '.form-activity-vimeo', function() {
  $('#form-vimeo-upload').toggle();
});


$(document).on('click','#vimeo_upload',function(){
  console.log('Clicou no upload',document.getElementById('video_token').value);
  var videos = $('#vimeo_video').get(0).files;
  var video_name = document.getElementById('video_name').value;
  var video_description = document.getElementById('video_description').value;
  if(!video_name || !video_description){
    showAlertGeneral('danger','É necessário o nome e uma descrição do vídeo para upload')
    return false;
  }

  if(videos.length == 0){
    showAlertGeneral('danger', 'Selecione um arquivo');
    return false;
  }

  if(!videos[0].type.match('video.*')){
    showAlertGeneral('danger', 'Selecione um arquivo de vídeo');
    return false; 
  }

  var form = $(this).closest('form');
  var button = $('.form-activity-vimeo',form);

  /* Rest the progress bar and show it */
  updateProgress(0)
  document.getElementById('progress-container').style.display = 'block'


  /* Instantiate Vimeo Uploader */
  ;(new VimeoUpload({
    name: video_name,
    description: video_description,
    private: document.getElementById('make_private').checked,
    file: videos[0],
    token: document.getElementById('video_token').value,
    embedDomain: window.location.hostname,
    onError: function(data) {
      showAlertGeneral('danger', '<strong>Error</strong>: ' + JSON.parse(data).error);
    },
    onProgress: function(data) {
      updateProgress(data.loaded / data.total)
    },
    onComplete: function(videoId, index) {
      var url = 'https://vimeo.com/' + videoId
      var metadata = this.metadata[index];
      if (index > -1) {
        /* The metadata contains all of the uploaded video(s) details see: https://developer.vimeo.com/api/endpoints/videos#/{video_id} */
        url = metadata.link //
      }
      console.log(this.metadata[index],'Dados do vídeo');
      $('.activity-value').prepend(url);
      $('#form-vimeo-upload').toggle();
      if(!button.data('post')){
        console.log('Não é post');
        $('.input-medias',form).val(JSON.stringify([{
          kind:'vimeo',
          title:video_name,
          description:video_description,
          url:url,
          iframe:metadata.embed.html}]
         ));
        console.log($('.input-medias',form).val());
        $('.previewMedia', form).append(getTemplateMediaPreview(form));

        $('.atc_title', form).html(video_name);
        $('.atc_url', form).html(url);
        $('.atc_desc', form).html(video_description);

        $('.atc_images', form).html(' ');
        $('.atc_images', form).append('<img src="/img/vimeo-loading.png" class="span12" id="1">');
        $('.atc_desc_type_media', form).html('imagem');
        $('.atc_total_images', form).html(1);
        $('.atc_images img', form).hide();
        $('img#1', form).fadeIn();
        $('.cur_image', form).val(1);
        $('.cur_image_num', form).html(1);
        $('.previewMedia', form).fadeIn('slow');
        $('.preview-image', form).fadeIn('slow');
        $('.attach_content', form).fadeIn('slow');
      }else{
        $('.vimeo-link',form).html('Vimeo link: <input type="text" readonly="true" value="' + url + '">');
      }
      
      updateProgress(0)
      $('#video_name',form).val('')
      $('#video_description',form).val('')

      showAlertGeneral('success', '<strong>Vídeo enviado com sucesso</strong>');
    }
  })).upload()
})

$(document).on('click','#form_vimeo_list',function(){
  console.log('Vimeo List');
  var button = $(this);
  var form = $(this).closest('form');
  var token = $('#video_token',form).val();
  var user_id = $('#vimeo_user_id',form).val();

  if($('.vimeo-list-wrap').is(":visible")){
    $('.vimeo-list-wrap').hide();
    return false;
  }else{
    $('.vimeo-list-wrap').fadeIn('slow');
  }
  $('.vimeo-loading').fadeIn('slow');
  $.ajax({
    url: 'https://api.vimeo.com/users/' + user_id + '/videos',
    type: 'GET',
    dataType: 'json',
    data: {per_page:50},
    beforeSend: function(xhr, settings) { 
      xhr.setRequestHeader('Authorization','Bearer ' + token);
    },
    success: function(response) {
      console.log('Retorno do vimeo',response);
      var videos = response.data;
      $('.vimeo-list',form).html('');
      for (var i in videos) {
        $('.vimeo-list',form).append('<option value="' + i + '">' + videos[i].name + '</option>');
      }
      $('.vimeo-list').fadeIn('slow');
      $('.vimeo-list-wrap',form).on('change','.vimeo-list',function(){
        var video_selected = videos[$(this).val()];
        $('.input-medias',form).val(JSON.stringify([{
            kind:'vimeo',
            title:video_selected.name,
            description:video_selected.description,
            url:video_selected.link,
            iframe:video_selected.embed.html
          }]
         ));

        if(!button.data('post')){
          $('.previewMedia', form).append(getTemplateMediaPreview(form));

          $('.atc_title', form).html(video_selected.name);
          $('.atc_url', form).html(video_selected.link);
          $('.atc_desc', form).html(video_selected.description);

          $('.atc_images', form).html(' ');

          var image =  video_selected.pictures.sizes[video_selected.pictures.sizes.length - 1];
          $('.atc_images', form).append('<img src="' + image.link + '" class="span12" id="1">');
          $('.atc_desc_type_media', form).html('imagem');
          $('.atc_total_images', form).html(1);
          $('.atc_images img', form).hide();
          $('img#1', form).fadeIn();
          $('.cur_image', form).val(1);
          $('.cur_image_num', form).html(1);
          $('.previewMedia', form).fadeIn('slow');
          $('.preview-image', form).fadeIn('slow');
          $('.attach_content', form).fadeIn('slow');

          $('.activity-value',form).val(video_selected.link);
        }else{
          $('.vimeo-link',form).html('Vimeo link: <input type="text" readonly="true" value="' + video_selected.link + '">');
        }
      })
    },
    error: function(response) {
      return showResponseError(response, null, {
        subject: 'Erro ao acessar Vimeo'
      });
    }
  });
})

/**
 * Updat progress bar.
 */
function updateProgress(progress) {
    progress = Math.floor(progress * 100)
    var element = document.getElementById('progress')
    element.setAttribute('style', 'width:' + progress + '%')
    element.innerHTML = '&nbsp;' + progress + '%'
}