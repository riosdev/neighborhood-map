// Pontos de interesse selecionados para aparecer no mapa.
var pontosDeInteresse = [{
    nome: "Valente Cervejas Especiais",
    localizacao: {
      lat: -30.060568,
      lng: -51.220117
    }
  },
  {
    nome: "Armazém Mazzola",
    localizacao: {
      lat: -30.055207,
      lng: -51.224583
    }
  },
  {
    nome: "Parque Marinha do Brasil",
    localizacao: {
      lat: -30.049306,
      lng: -51.230174
    }
  },
  {
    nome: "Vinhos Do Mundo",
    localizacao: {
      lat: -30.054678,
      lng: -51.222627
    }
  },
  {
    nome: "Heilige Brew Pub",
    localizacao: {
      lat: -30.054851,
      lng: -51.222651
    }
  },
  {
    nome: "Centro Estadual de Treinamento Esportivo (CETE)",
    localizacao: {
      lat: -30.055633,
      lng: -51.220161
    }
  },
  {
    nome: "Confeitaria Dona Nina",
    localizacao: {
      lat: -30.054695,
      lng: -51.221152
    }
  }
];

function Exibir() {
  // inicializa variaveis
  var self = this;
  var largeInfowindow = new google.maps.InfoWindow();
  self.markers = [];
  var content = "Inicializando... aguarde.";
  var client_id = "502N4UPQF3JMNCFYJHN2X03F0XH2NHTY4DBLQHTH3G53LH14";
  var client_secret = "XY5BEKIGC3CNZT4IHCBJHWOH1YSONUPO4G1GW0C0RPWXPAKC";
  var bounds = new google.maps.LatLngBounds();

  self.showPlaces = ko.observableArray(pontosDeInteresse);
  self.showPlaces().forEach(function (lugar) {
    // cria marcadores
    marker = new google.maps.Marker({
      title: lugar.nome,
      position: lugar.localizacao,
      map: mapa,
      animation: google.maps.Animation.DROP
    });
    lugar.marker = marker;
    this.markers.push(marker);
    // mostra informações ao clicar no marcador
    marker.addListener('click', function () {
      mostrarInformacoes(this, largeInfowindow);
    });

    // alterna navegação lateral
    self.aberto = ko.observable(false);
    self.abrir = function () {
      self.aberto(!self.aberto());
    };

    bounds.extend(marker.position);
    mapa.fitBounds(bounds);
  });

  // Funcao que acessa a API do Foursquare
  function mostrarInformacoes(marcador, infowindow) {
    // Verifica se as informacoes deste marcador ja estao expostas
    if (infowindow.marker != marcador) {
      // use ajax to abstract information by using location's name
      $.ajax({
        dataType: "json",
        url: "https://api.foursquare.com/v2/venues/search",
        data: {
          client_id: client_id, // credenciais do foursquare
          client_secret: client_secret,
          query: marcador.title, // pega nome
          near: "menino deus", // aproxima resultados
          limit: 1, // limita o numero de resultados (otimizacao)
          v: 20171101 // versao
        },
        success: function (data) {
          local = data.response.venues[0];
          nome = local.name;
          fsID = local.id;
          link = "https://foursquare.com/v/" + fsID;
          end1 = local.location.formattedAddress[0];
          end2 = local.location.formattedAddress[1];
          // Solicita uma foto do local
          $.ajax({
            dataType: "json",
            url: "https://api.foursquare.com/v2/venues/" + fsID + '/photos',
            data: {
              client_id: client_id,
              client_secret: client_secret,
              limit: 2,
              v: 20171101,
            },
            // Carrega imagem
            success: function (data) {
              info = data.response.photos.items[0];
              foto = info.prefix + '250x200' + info.suffix;
            }
          }).done(function () {
            // Mostra cartao com informacoes
            content = '<div class="card" style="width: 14rem;">' +
              '<img class="card-img-top" src="' + foto + '" alt="foto do local">' +
              '<div class="card-body"><h5 class="card-title">' + nome + '</h5>' +
              '<p class="card-text">' + end1 + '</p><p class="card-text">' +
              end2 + '</p>' + '<a href="' + link +
              '" class="btn btn-primary">Mais informações</a></div></div>';
            marcador.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
              marcador.setAnimation(null);
            }, 1420);
            infowindow.marker = marcador;
            infowindow.setContent(content);
            infowindow.open(mapa, marcador);
            mapa.setZoom(16);
            mapa.panTo(marcador.position);
            infowindow.addListener('closeclick', function () {
              infowindow.setMarker = null;
            });
          });

        },
        // Mostra mensagem de erro caso haja falha no ajax
        error: function () {
          content = '<div class="infotitle">' + 'Ocorreu um erro.' + '</div>';
          marcador.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function () {
            marcador.setAnimation(null);
          }, 1420);
          infowindow.marker = marcador;
          infowindow.setContent(content);
          infowindow.open(mapa, marcador);
          mapa.setZoom(16);
          mapa.panTo(marcador.position);
          infowindow.addListener('closeclick', function () {
            infowindow.setMarker = null;
          });
        }
      });
    }
  }

  self.listViewClick = function (li) {
    // Clicar no titulo e no marcador tem a mesma funcao
    if (li.nome) {
      mapa.setZoom(16);
      mapa.panTo(li.localizacao);
      li.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function () {
        li.marker.setAnimation(null);
      }, 1420);
      mostrarInformacoes(li.marker, largeInfowindow);
      if (screen.width < 500) {
        document.getElementById("navi").style.left = "20px";
        document.getElementById("mapa").style.marginLeft = "0px";
      }
    }
  };

  // Filtra os pontos de interesse de acordo com a pesquisa
  self.query = ko.observable('');
  self.search = ko.computed(function () {
    var filter = self.query().toLowerCase();
    var inQuery = self.showPlaces();
    return ko.utils.arrayFilter(inQuery, function (data) {
      if (data.nome.toLowerCase().indexOf(filter) >= 0) {
        data.marker.setVisible(true);
        return true;
      } else {
        data.marker.setVisible(false);
      }
    });
  });
}
var mapa;

function inicializarMapa() {
  mapa = new google.maps.Map(document.getElementById('mapa'), {
    center: {
      lat: -30.051226,
      lng: -51.222885
    },
    zoom: 12,
    mapTypeControl: false,
  });
  // Carregar mapa
  ko.applyBindings(Exibir());
}
// Alertar o usuário em caso de erro
function erro() {
  alert("Ocorreu um erro. Tente novamente mais tarde.");
}