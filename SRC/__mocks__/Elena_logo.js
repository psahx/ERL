!function(){
  
  "use strict";
  
  Lampa.SettingsApi.addParam({
    component:"interface",
    param:{
      name:"logo_glav",
      type:"select",
      values:{
        1:"Скрыть",
        0:"Отображать"
      },
      default:"0"
    },
    field:{
      name:"Логотипы вместо названий",
      description:"Отображает логотипы фильмов вместо текста"
    }
  }),
    
    window.logoplugin||(window.logoplugin=!0,
      Lampa.Listener.follow("full",
          (function(a){
              if("complite"==a.type&&"1"!=Lampa.Storage.get("logo_glav")){
                var e=a.data.movie,
                  t=Lampa.TMDB.api(e.name?"tv":"movie/"+e.id+"/images?api_key="+Lampa.TMDB.key()+"&language="+Lampa.Storage.get("language"));
                console.log(t),
                  $.get(t,(function(e){
                    if(e.logos&&e.logos[0]){
                      var t=e.logos[0].file_path;
                      ""!=t&&a.object.activity.render().find(".full-start-new__title").html('<img style="margin-top: 5px;max-height: 125px;" src="'+Lampa.TMDB.image("/t/p/w300"+t.replace(".svg",".png"))+'" />')
                    }
                  }))
              }
          })))
}();
