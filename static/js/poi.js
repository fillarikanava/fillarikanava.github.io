(function() {
  var GeocoderPOIProvider, POI, POICategory, POIProvider, WaagPOIProvider, generate_area_poi_categories, get_polygon_center, hel_geocoder_poi_url, icon_base_path, navigate_to_poi, position_missing_alert_shown, supported_poi_categories, supported_poi_providers, waag_id, waag_url, _ref, _ref1, _ref2,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = citynavi.config, hel_geocoder_poi_url = _ref.hel_geocoder_poi_url, waag_url = _ref.waag_url, waag_id = _ref.waag_id, icon_base_path = _ref.icon_base_path;

  POI = (function() {
    function POI(opts) {
      _.extend(this, opts);
    }

    return POI;

  })();

  POIProvider = (function() {
    function POIProvider(opts) {
      _.extend(this, opts);
    }

    return POIProvider;

  })();

  GeocoderPOIProvider = (function(_super) {
    __extends(GeocoderPOIProvider, _super);

    function GeocoderPOIProvider() {
      _ref1 = GeocoderPOIProvider.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    GeocoderPOIProvider.prototype.fetch_pois = function(category, opts) {
      var params,
        _this = this;
      params = {
        category__type: category.type,
        municipality__id: citynavi.config.poi_muni_id
      };
      if (opts.location) {
        params.lat = opts.location[0];
        params.lon = opts.location[1];
      }
      return $.getJSON(hel_geocoder_poi_url, params, function(data) {
        var obj, poi, poi_list, _i, _len, _ref2;
        poi_list = [];
        _ref2 = data.objects;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          poi = new POI({
            name: obj.name,
            coords: [obj.location.coordinates[1], obj.location.coordinates[0]],
            category: category,
            distance: obj.distance
          });
          poi_list.push(poi);
        }
        return opts.callback(poi_list, opts.callback_args);
      });
    };

    return GeocoderPOIProvider;

  })(POIProvider);

  get_polygon_center = function(polygon) {
    var f, i, j, nPts, off_, p1, p2, pts, twicearea, x, y;
    pts = polygon._latlngs;
    off_ = pts[0];
    twicearea = x = y = 0;
    nPts = pts.length;
    p1 = p2 = f = null;
    i = 0;
    j = nPts - 1;
    while (i < nPts) {
      p1 = pts[i];
      p2 = pts[j];
      f = (p1.lat - off_.lat) * (p2.lng - off_.lng) - (p2.lat - off_.lat) * (p1.lng - off_.lng);
      twicearea += f;
      x += (p1.lat + p2.lat - 2 * off_.lat) * f;
      y += (p1.lng + p2.lng - 2 * off_.lng) * f;
      j = i++;
    }
    f = twicearea * 3;
    return [x / f + off_.lat, y / f + off_.lng];
  };

  WaagPOIProvider = (function(_super) {
    __extends(WaagPOIProvider, _super);

    function WaagPOIProvider() {
      _ref2 = WaagPOIProvider.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    WaagPOIProvider.prototype.fetch_pois = function(category, opts) {
      var count, params,
        _this = this;
      count = 10;
      opts = _.extend({}, opts);
      params = {
        layer: "osm",
        geom: 1,
        per_page: count * 2
      };
      if (category.waag_filter) {
        _.extend(params, category.waag_filter);
      } else {
        params["osm::amenity"] = category.type;
      }
      console.log(params);
      if ($('#wheelchair').attr('checked')) {
        params["osm::wheelchair"] = "yes";
      }
      if (opts.location) {
        params.lat = opts.location[0];
        params.lon = opts.location[1];
      }
      return $.getJSON("" + waag_url + waag_id + "/nodes", params, function(data) {
        var coords, latlngs, p, poi, poi_list, points, poly, res, type, _i, _len, _ref3, _ref4, _ref5, _ref6;
        poi_list = [];
        _ref3 = data.results;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          res = _ref3[_i];
          type = res.geom.type;
          if (type === "Polygon") {
            points = res.geom.coordinates[0];
            latlngs = (function() {
              var _j, _len1, _results;
              _results = [];
              for (_j = 0, _len1 = points.length; _j < _len1; _j++) {
                p = points[_j];
                _results.push(new L.LatLng(p[1], p[0]));
              }
              return _results;
            })();
            poly = new L.Polygon(latlngs);
            coords = get_polygon_center(poly);
          } else {
            coords = res.geom.coordinates;
            coords = [coords[1], coords[0]];
          }
          poi = new POI({
            name: res.name,
            coords: coords,
            category: category,
            "private": ((_ref4 = res.layers) != null ? (_ref5 = _ref4.osm) != null ? (_ref6 = _ref5.data) != null ? _ref6.access : void 0 : void 0 : void 0) === "private"
          });
          poi_list.push(poi);
        }
        poi_list = _.sortBy(poi_list, function(poi) {
          var poi_loc;
          poi_loc = new L.LatLng(poi.coords[0], poi.coords[1]);
          poi.distance = poi_loc.distanceTo(opts.location);
          return poi.distance;
        });
        return opts.callback(poi_list.slice(0, count), opts.callback_args);
      });
    };

    return WaagPOIProvider;

  })(POIProvider);

  supported_poi_providers = {
    "geocoder": new GeocoderPOIProvider,
    "waag": new WaagPOIProvider
  };

  POICategory = (function() {
    function POICategory(opts) {
      _.extend(this, opts);
      this.provider = null;
    }

    POICategory.prototype.set_provider = function(provider, provider_args) {
      this.provider = provider;
      return this.provider_args = provider_args;
    };

    POICategory.prototype.get_icon_path = function() {
      return icon_base_path + this.icon;
    };

    POICategory.prototype.get_icon_html = function() {
      return '<img src="' + this.get_icon_path() + '">';
    };

    POICategory.prototype.fetch_pois = function(opts) {
      return this.provider.fetch_pois(this, opts);
    };

    return POICategory;

  })();

  supported_poi_categories = {
    "library": new POICategory({
      type: "library",
      name: "Library",
      plural_name: "Libraries",
      icon: "library.svg"
    }),
    "recycling": new POICategory({
      type: "recycling",
      name: "Recycling point",
      icon: "recycling.svg"
    }),
    "park": new POICategory({
      type: "park",
      name: "Park",
      icon: "coniferous_and_deciduous.svg",
      waag_filter: {
        "osm::leisure": "park"
      }
    }),
    "swimming_pool": new POICategory({
      type: "swimming_pool",
      name: "Swimming pool",
      icon: "swimming_indoor.svg"
    }),
    "cafe": new POICategory({
      type: "cafe",
      name: "Cafe",
      icon: "cafe.svg"
    }),
    "bar": new POICategory({
      type: "bar",
      name: "Bar",
      icon: "bar.svg"
    }),
    "pharmacy": new POICategory({
      type: "pharmacy",
      name: "Pharmacy",
      icon: "pharmacy.svg",
      waag_filter: {
        "osm::amenity": "pharmacy"
      }
    }),
    "toilet": new POICategory({
      type: "toilet",
      name: "Toilet (public)",
      icon: "toilets_men.svg",
      waag_filter: {
        "osm::amenity": "toilets"
      }
    }),
    "pub": new POICategory({
      type: "pub",
      name: "Pub",
      icon: "pub.svg"
    }),
    "supermarket": new POICategory({
      type: "supermarket",
      name: "Supermarket",
      icon: "supermarket.svg",
      waag_filter: {
        "osm::shop": "supermarket"
      }
    }),
    "restaurant": new POICategory({
      type: "restaurant",
      name: "Restaurant",
      icon: "restaurant.svg"
    })
  };

  generate_area_poi_categories = function(area) {
    var cat, cat_list, prov, prov_cat, prov_cats, prov_name, _i, _len, _ref3;
    cat_list = [];
    for (prov_name in area.poi_providers) {
      prov = supported_poi_providers[prov_name];
      console.assert(prov);
      prov_cats = area.poi_providers[prov_name];
      _ref3 = area.poi_providers[prov_name];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        prov_cat = _ref3[_i];
        cat = supported_poi_categories[prov_cat.type];
        console.assert(cat);
        console.assert(cat.provider === null);
        cat.set_provider(prov);
        cat_list.push(cat);
      }
    }
    return cat_list;
  };

  citynavi.poi_categories = generate_area_poi_categories(citynavi.config);

  console.log(citynavi.poi_categories);

  $('#service-directory').bind('pageinit', function(e, data) {
    var $list;
    $list = $('#service-directory ul');
    $list.empty();
    return $list.listview();
  });

  $('#service-list').bind('pageinit', function(e, data) {
    var $list;
    $list = $('#service-list ul');
    $list.empty();
    return $list.listview();
  });

  $('#service-directory').bind('pageshow', function(e, data) {
    var $list, category, index, _i, _len, _ref3;
    $list = $('#service-directory ul');
    $list.empty();
    _ref3 = citynavi.poi_categories;
    for (index = _i = 0, _len = _ref3.length; _i < _len; index = ++_i) {
      category = _ref3[index];
      $list.append("<li><a href=\"#service-list?category=" + index + "\"><img src=\"" + (category.get_icon_path()) + "\" class='ui-li-icon' style='height: 20px;'/>" + category.name + "</a></li>");
    }
    return $list.listview("refresh");
  });

  position_missing_alert_shown = false;

  $(document).bind("pagebeforechange", function(e, data) {
    var $list, category, category_index, current_location, u;
    if (typeof data.toPage !== "string") {
      return;
    }
    u = $.mobile.path.parseUrl(data.toPage);
    if (u.hash.indexOf('#service-list?category=') === 0) {
      category_index = u.hash.replace(/.*\?category=/, "");
      category = citynavi.poi_categories[category_index];
      $list = $('#service-list ul');
      $list.empty();
      current_location = citynavi.get_source_location();
      if (current_location == null) {
        if (!position_missing_alert_shown) {
          alert("The device hasn't provided its current location. Using region center instead.");
          position_missing_alert_shown = true;
        }
        current_location = citynavi.config.center;
      }
      return category.fetch_pois({
        location: current_location,
        callback: function(pois) {
          var poi, _fn, _i, _len;
          _fn = function(poi) {
            var $item, dist;
            if (!poi.name) {
              poi.name = "Unnamed " + (category.name.toLowerCase());
            }
            if (poi["private"]) {
              poi.name = "" + poi.name + " (private)";
            }
            dist = poi.distance;
            if (dist >= 1000) {
              dist = Math.round((dist + 100) / 100);
              dist *= 100;
            } else {
              dist = Math.round((dist + 10) / 10);
              dist *= 10;
            }
            $item = $("<li><a href=\"#map-page\"><img src=\"" + (category.get_icon_path()) + "\" class='ui-li-icon' style=\"height: 20px;\"/>" + poi.name + "<span class='ui-li-count'>" + dist + " m</span></a></li>");
            $item.click(function() {
              citynavi.poi_list = pois;
              return navigate_to_poi(poi);
            });
            return $list.append($item);
          };
          for (_i = 0, _len = pois.length; _i < _len; _i++) {
            poi = pois[_i];
            _fn(poi);
          }
          return $list.listview("refresh");
        }
      });
    }
  });

  navigate_to_poi = function(poi) {
    var idx, loc, page;
    loc = new Location(poi.name, poi.coords);
    idx = location_history.add(loc);
    page = "#map-page?destination=" + idx;
    return $.mobile.changePage(page);
  };

}).call(this);

/*
//@ sourceMappingURL=poi.js.map
*/