(function() {
  var defaults, hel_geocoder_base_url, hel_servicemap_base_url, helsinki, hsl_colors, manchester, nl, tampere;

  citynavi.update_configs = function(configs) {
    var config, key, _ref;
    citynavi.configs || (citynavi.configs = {});
    for (key in configs) {
      config = configs[key];
      citynavi.configs[key] = _.extend(citynavi.configs[key] || {}, config);
    }
    if ((_ref = citynavi.config) != null ? _ref.id : void 0) {
      return citynavi.set_config(citynavi.config.id);
    }
  };

  citynavi.set_config = function(id) {
    citynavi.config = _.extend({}, citynavi.configs.defaults, citynavi.configs[id], citynavi.configs.overrides || {});
    return citynavi.config.id = id;
  };

  hsl_colors = {
    walk: '#9ab9c9',
    wait: '#999999',
    1: '#007ac9',
    2: '#00985f',
    3: '#007ac9',
    4: '#007ac9',
    5: '#007ac9',
    6: '#ff6319',
    7: '#00b9e4',
    8: '#007ac9',
    12: '#64be14',
    21: '#007ac9',
    22: '#007ac9',
    23: '#007ac9',
    24: '#007ac9',
    25: '#007ac9',
    36: '#007ac9',
    38: '#007ac9',
    39: '#007ac9'
  };

  hel_geocoder_base_url = "http://dev.hel.fi/geocoder/v1/";

  hel_servicemap_base_url = "http://www.hel.fi/palvelukarttaws/rest/v2/";

  defaults = {
    hel_geocoder_address_url: hel_geocoder_base_url + "address/",
    hel_geocoder_poi_url: hel_geocoder_base_url + "poi/",
    waag_url: "http://api.citysdk.waag.org/",
    google_url: "http://dev.hel.fi/geocoder/google/",
    nominatim_url: "http://open.mapquestapi.com/nominatim/v1/search.php",
    bag42_url: "http://bag42.nl/api/v0/geocode/json",
    hel_servicemap_service_url: hel_servicemap_base_url + "service/",
    hel_servicemap_unit_url: hel_servicemap_base_url + "unit/",
    reittiopas_url: "http://tuukka.kapsi.fi/tmp/reittiopas.cgi?callback=?",
    osm_notes_url: "http://api.openstreetmap.org/api/0.6/notes.json",
    faye_url: "http://dev.hsl.fi:9002/faye",
    icon_base_path: "static/images/",
    min_zoom: 10,
    colors: {
      hsl: hsl_colors,
      google: {
        WALK: hsl_colors.walk,
        CAR: hsl_colors.walk,
        BICYCLE: hsl_colors.walk,
        WAIT: hsl_colors.wait,
        0: hsl_colors[2],
        1: hsl_colors[6],
        2: hsl_colors[12],
        3: hsl_colors[5],
        4: hsl_colors[7],
        109: hsl_colors[12]
      }
    },
    icons: {
      google: {
        WALK: 'walking.svg',
        CAR: 'car.svg',
        BICYCLE: 'bicycle.svg',
        WAIT: 'clock.svg',
        0: 'tram_stop.svg',
        1: 'subway.svg',
        2: 'train_station2.svg',
        3: 'bus_stop.svg',
        4: 'port.svg',
        109: 'train_station2.svg'
      }
    },
    maps: {
      cloudmade: {
        name: "CloudMade",
        url_template: 'http://{s}.tile.cloudmade.com/{key}/{style}/256/{z}/{x}/{y}.png',
        opts: {
          attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
          key: 'BC9A493B41014CAABB98F0471D759707',
          style: 998
        }
      },
      osm: {
        name: "OpenStreetMap",
        url_template: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        opts: {
          attribution: 'Map data &copy; 2011 OpenStreetMap contributors'
        }
      },
      opencyclemap: {
        name: "OpenCyclemap",
        url_template: 'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
        opts: {
          attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery by <a href="http://www.opencyclemap.org/" target="_blank">OpenCycleMap</a>'
        }
      },
      mapquest: {
        name: "MapQuest",
        url_template: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg',
        opts: {
          subdomains: '1234',
          attribution: 'Map data &copy; 2013 OpenStreetMap contributors, Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
        }
      }
    }
  };

  tampere = {
    name: "Tampere",
    country: "fi",
    cities: ["Tampere"],
    google_autocomplete_append: "Tampere",
    bbox_ne: [61.8237444, 24.1064742],
    bbox_sw: [61.42863, 23.5611791],
    center: [61.4976348, 23.7688124],
    otp_base_url: "http://dev.hsl.fi/tampere/opentripplanner-api-webapp/ws/",
    poi_muni_id: null,
    waag_id: "admr.fi.tampere",
    poi_providers: {
      "waag": [
        {
          type: "library"
        }, {
          type: "park"
        }, {
          type: "swimming_pool"
        }, {
          type: "restaurant"
        }, {
          type: "cafe"
        }, {
          type: "bar"
        }, {
          type: "pub"
        }, {
          type: "supermarket"
        }, {
          type: "pharmacy"
        }, {
          type: "toilet"
        }, {
          type: "recycling"
        }
      ]
    },
    autocompletion_providers: ["poi_categories", "history", "osm", "google"]
  };

  manchester = {
    name: "Greater Manchester",
    country: "gb",
    cities: ["Bolton", "Bury", "Oldham", "Rochdale", "Stockport", "Tameside", "Trafford", "Wigan", "Manchester", "Salford"],
    google_autocomplete_append: "Manchester",
    bbox_ne: [53.685760, -1.909630],
    bbox_sw: [53.327332, -2.730550],
    center: [53.479167, -2.244167],
    otp_base_url: "http://dev.hsl.fi/manchester/opentripplanner-api-webapp/ws/",
    poi_muni_id: 44001,
    waag_id: "admr.uk.gr.manchester",
    poi_providers: {
      "waag": [
        {
          type: "restaurant"
        }, {
          type: "cafe"
        }, {
          type: "bar"
        }, {
          type: "pub"
        }, {
          type: "supermarket"
        }, {
          type: "swimming_pool"
        }, {
          type: "pharmacy"
        }
      ],
      "geocoder": [
        {
          type: "park"
        }, {
          type: "library"
        }, {
          type: "recycling"
        }, {
          type: "toilet"
        }
      ]
    },
    autocompletion_providers: ["poi_categories", "history", "osm", "google"]
  };

  helsinki = {
    name: "Helsinki Region",
    country: "fi",
    cities: ["Helsinki", "Vantaa", "Espoo", "Kauniainen", "Kerava", "Sipoo", "Kirkkonummi"],
    bbox_ne: [60.653728, 25.576590],
    bbox_sw: [59.903339, 23.692820],
    center: [60.170833, 24.9375],
    min_zoom: 12,
    otp_base_url: "http://dev.hsl.fi/opentripplanner-api-webapp/ws/",
    poi_muni_id: null,
    waag_id: "admr.fi.uusimaa",
    poi_providers: {
      "waag": [
        {
          type: "restaurant"
        }, {
          type: "cafe"
        }, {
          type: "bar"
        }, {
          type: "pub"
        }, {
          type: "supermarket"
        }, {
          type: "pharmacy"
        }
      ],
      "geocoder": [
        {
          type: "park"
        }, {
          type: "library"
        }, {
          type: "recycling"
        }, {
          type: "swimming_pool"
        }, {
          type: "toilet"
        }
      ]
    },
    autocompletion_providers: ["poi_categories", "history", "geocoder", "osm"]
  };

  nl = {
    name: "Netherlands",
    country: "nl",
    cities: null,
    google_autocomplete_append: "Netherlands",
    google_suffix: ", The Netherlands",
    bbox_ne: [53.617498100000006, 13.43461],
    bbox_sw: [43.554167, 2.35503],
    center: [52.37832, 4.89973],
    min_zoom: 8,
    otp_base_url: "http://144.76.26.165/amsterdam/otp-rest-servlet/ws/",
    poi_muni_id: null,
    waag_id: "admr.nl.nederland",
    poi_providers: {
      "waag": [
        {
          type: "library"
        }, {
          type: "park"
        }, {
          type: "swimming_pool"
        }, {
          type: "restaurant"
        }, {
          type: "cafe"
        }, {
          type: "bar"
        }, {
          type: "pub"
        }, {
          type: "supermarket"
        }, {
          type: "toilet"
        }, {
          type: "recycling"
        }
      ]
    },
    autocompletion_providers: ["poi_categories", "osm", "bag42", "google"]
  };

  citynavi.update_configs({
    defaults: defaults,
    helsinki: helsinki,
    manchester: manchester,
    tampere: tampere,
    nl: nl
  });

  citynavi.set_config("helsinki");

}).call(this);

/*
//@ sourceMappingURL=config.js.map
*/