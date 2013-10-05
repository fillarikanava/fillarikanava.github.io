//@ sourceMappingURL=routing.map
(function() {
  var BackControl, DetailsControl, TRANSFORM_MAP, commentMarker, contextmenu, control_layers, create_tile_layer, create_wait_leg, decode_polyline, display_route_result, fillarikanava, find_route, find_route_offline, find_route_otp, find_route_reittiopas, format_code, format_time, google_colors, google_icons, hel_servicemap_unit_url, interpolations, key, layers, map, marker_changed, offline_cleanup, onSourceDragEnd, onTargetDragEnd, osm_notes_url, osmnotes, otp_cleanup, poi_markers, positionMarker, positionMarker2, position_bounds, position_point, previous_positions, reittiopas_url, render_route_buttons, render_route_layer, resize_map, routeLayer, route_to_destination, route_to_service, set_comment_marker, set_source_marker, set_target_marker, sourceCircle, sourceMarker, targetMarker, transform_location, transport_colors, value, vehicles, _ref, _ref1, _ref2;

  map = null;

  layers = {};

  positionMarker = sourceMarker = targetMarker = commentMarker = null;

  positionMarker2 = null;

  sourceCircle = null;

  routeLayer = null;

  position_point = position_bounds = null;

  vehicles = [];

  previous_positions = [];

  interpolations = [];

  $(document).bind("pageshow", function(e, data) {
    var page_id;
    page_id = $.mobile.activePage.attr("id");
    return $('html').attr('class', "ui-mobile mode-" + page_id);
  });

  $(document).bind("pagebeforechange", function(e, data) {
    var destination, location, srv_id, start_bounds, u, zoom;
    if (typeof data.toPage !== "string") {
      console.log("pagebeforechange without toPage");
      return;
    }
    console.log("pagebeforechange", data.toPage);
    u = $.mobile.path.parseUrl(data.toPage);
    if (u.hash.indexOf('#navigation-page') === 0) {
      start_bounds = L.latLngBounds([sourceMarker.getLatLng()]);
      if (position_bounds != null) {
        start_bounds.extend(position_bounds);
      }
      zoom = Math.min(map.getBoundsZoom(start_bounds), 18);
      map.setView(start_bounds.getCenter(), zoom);
    }
    if (u.hash.indexOf('#map-page?service=') === 0) {
      srv_id = u.hash.replace(/.*\?service=/, "");
      e.preventDefault();
      route_to_service(srv_id);
    }
    if (u.hash.indexOf('#map-page?destination=') === 0) {
      destination = u.hash.replace(/.*\?destination=/, "");
      e.preventDefault();
      location = location_history.get(destination);
      return route_to_destination(location);
    }
  });

  $('#map-page').bind('pageshow', function(e, data) {
    var zoom;
    console.log("#map-page pageshow");
    resize_map();
    if (targetMarker != null) {
      if (sourceMarker != null) {
        sourceMarker.closePopup();
      }
      targetMarker.closePopup();
      targetMarker.openPopup();
    } else if (sourceMarker != null) {
      sourceMarker.closePopup();
      sourceMarker.openPopup();
    }
    if (routeLayer != null) {
      return map.fitBounds(routeLayer.getBounds());
    } else if (position_point != null) {
      zoom = Math.min(map.getBoundsZoom(position_bounds), 15);
      return map.setView(position_point, zoom);
    }
  });

  $('#map-page [data-rel="back"]').on('click', function(e) {
    var zoom;
    if (routeLayer != null) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    $('.route-list ul').empty().hide().parent().removeClass("active");
    $('.control-details').empty();
    if (sourceMarker != null) {
      map.removeLayer(sourceMarker);
      sourceMarker = null;
    }
    if (targetMarker != null) {
      map.removeLayer(targetMarker);
      targetMarker = null;
    }
    if (commentMarker != null) {
      map.removeLayer(commentMarker);
      commentMarker = null;
    }
    if (position_point) {
      zoom = Math.min(map.getBoundsZoom(position_bounds), 15);
      map.setView(position_point, zoom);
      return set_source_marker(position_point, {
        accuracy: positionMarker.getRadius()
      });
    } else {
      return map.setView(citynavi.config.center, citynavi.config.min_zoom);
    }
  });

  transport_colors = citynavi.config.colors.hsl;

  google_colors = citynavi.config.colors.google;

  google_icons = citynavi.config.icons.google;

  _ref = citynavi.config, hel_servicemap_unit_url = _ref.hel_servicemap_unit_url, osm_notes_url = _ref.osm_notes_url, reittiopas_url = _ref.reittiopas_url;

  format_code = function(code) {
    if (code.substring(0, 3) === "300") {
      return code.charAt(4);
    } else if (code.substring(0, 4) === "1300") {
      return "Metro";
    } else if (code.substring(0, 3) === "110") {
      return code.substring(2, 5);
    } else if (code.substring(0, 4) === "1019") {
      return "Suomenlinna ferry";
    }
    return code.substring(1, 5).replace(/^(0| )+| +$/, "");
  };

  format_time = function(time) {
    return time.replace(/(....)(..)(..)(..)(..)/, "$1-$2-$3 $4:$5");
  };

  decode_polyline = function(encoded, dims) {
    var b, dim, i, point, points, result, shift;
    point = (function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= dims ? _i < dims : _i > dims; i = 0 <= dims ? ++_i : --_i) {
        _results.push(0);
      }
      return _results;
    })();
    i = 0;
    points = (function() {
      var _i, _results;
      _results = [];
      while (i < encoded.length) {
        for (dim = _i = 0; 0 <= dims ? _i < dims : _i > dims; dim = 0 <= dims ? ++_i : --_i) {
          result = 0;
          shift = 0;
          while (true) {
            b = encoded.charCodeAt(i++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
            if (!(b >= 0x20)) {
              break;
            }
          }
          point[dim] += result & 1 ? ~(result >> 1) : result >> 1;
        }
        _results.push(point.slice(0));
      }
      return _results;
    })();
    return points;
  };

  set_source_marker = function(latlng, options) {
    var accuracy, measure;
    if (sourceMarker != null) {
      map.removeLayer(sourceMarker);
      sourceMarker = null;
    }
    sourceMarker = L.marker(latlng, {
      draggable: true
    }).addTo(map).on('dragend', onSourceDragEnd);
    if (options != null ? options.accuracy : void 0) {
      accuracy = options.accuracy;
      measure = options.measure;
      if (measure == null) {
        measure = accuracy < 2000 ? "within " + (Math.round(accuracy)) + " meters" : "within " + (Math.round(accuracy / 1000)) + " km";
      }
      sourceMarker.bindPopup("The starting point for journey planner<br>(tap the red marker to update)<br>You are " + measure + " from this point");
      if (sourceCircle !== null) {
        map.removeLayer(sourceCircle);
        sourceCircle = null;
      }
    } else {
      sourceMarker.bindPopup("The starting point for journey<br>(drag the marker to change)");
    }
    if (options.popup) {
      sourceMarker.openPopup();
    }
    return marker_changed(options);
  };

  set_target_marker = function(latlng, options) {
    var description;
    if (targetMarker != null) {
      map.removeLayer(targetMarker);
      targetMarker = null;
    }
    targetMarker = L.marker(latlng, {
      draggable: true
    }).addTo(map).on('dragend', onTargetDragEnd);
    description = options != null ? options.description : void 0;
    if (description == null) {
      description = "The end point for journey<br>(drag the marker to change)";
    }
    targetMarker.bindPopup(description).openPopup();
    return marker_changed(options);
  };

  onSourceDragEnd = function(event) {
    sourceMarker.unbindPopup();
    sourceMarker.bindPopup("The starting point for journey<br>(drag the marker to change)");
    return marker_changed();
  };

  onTargetDragEnd = function(event) {
    targetMarker.unbindPopup();
    targetMarker.bindPopup("The end point for journey<br>(drag the marker to change)");
    return marker_changed();
  };

  marker_changed = function(options) {
    if ((sourceMarker != null) && (targetMarker != null)) {
      return find_route(sourceMarker.getLatLng(), targetMarker.getLatLng(), function(route) {
        if (options != null ? options.zoomToFit : void 0) {
          return map.fitBounds(route.getBounds());
        } else if (options != null ? options.zoomToShow : void 0) {
          if (!map.getBounds().contains(route.getBounds())) {
            return map.fitBounds(route.getBounds());
          }
        }
      });
    }
  };

  poi_markers = [];

  route_to_destination = function(target_location) {
    var lat, lng, marker, poi, target, _fn, _i, _j, _len, _len1, _ref1, _ref2;
    console.log("route_to_destination", target_location.name);
    _ref1 = target_location.coords, lat = _ref1[0], lng = _ref1[1];
    $.mobile.changePage("#map-page");
    target = new L.LatLng(lat, lng);
    set_target_marker(target, {
      description: target_location.name,
      zoomToFit: true
    });
    for (_i = 0, _len = poi_markers.length; _i < _len; _i++) {
      marker = poi_markers[_i];
      map.removeLayer(marker);
    }
    poi_markers = [];
    if (citynavi.poi_list) {
      _ref2 = citynavi.poi_list;
      _fn = function(poi) {
        var icon, latlng;
        icon = L.AwesomeMarkers.icon({
          svg: poi.category.get_icon_path(),
          color: 'green'
        });
        latlng = new L.LatLng(poi.coords[0], poi.coords[1]);
        marker = L.marker(latlng, {
          icon: icon
        });
        marker.bindPopup("" + poi.name);
        marker.poi = poi;
        marker.on('click', function(e) {
          return set_target_marker(e.target.getLatLng(), {
            description: poi.name
          });
        });
        marker.addTo(map);
        return poi_markers.push(marker);
      };
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        poi = _ref2[_j];
        _fn(poi);
      }
    }
    return console.log("route_to_destination done");
  };

  route_to_service = function(srv_id) {
    var params, source;
    console.log("route_to_service", srv_id);
    if (sourceMarker == null) {
      alert("The device hasn't provided the current position!");
      return;
    }
    source = sourceMarker.getLatLng();
    params = {
      service: srv_id,
      distance: 1000,
      lat: source.lat.toPrecision(7),
      lon: source.lng.toPrecision(7)
    };
    $.getJSON(hel_servicemap_unit_url + "?callback=?", params, function(data) {
      var target;
      console.log("palvelukartta callback got data");
      window.service_dbg = data;
      if (data.length === 0) {
        alert("No service near the current position.");
        return;
      }
      $.mobile.changePage("#map-page");
      target = new L.LatLng(data[0].latitude, data[0].longitude);
      set_target_marker(target, {
        description: "" + data[0].name_en + "<br>(closest " + srv_id + ")"
      });
      return console.log("palvelukartta callback done");
    });
    return console.log("route_to_service done");
  };

  create_wait_leg = function(start_time, duration, point, placename) {
    var leg;
    leg = {
      mode: "WAIT",
      routeType: null,
      route: "",
      duration: duration,
      startTime: start_time,
      endTime: start_time + duration,
      legGeometry: {
        points: [point]
      },
      from: {
        lat: point[0] * 1e-5,
        lon: point[1] * 1e-5,
        name: placename
      }
    };
    leg.to = leg.from;
    return leg;
  };

  offline_cleanup = function(data) {
    var index, itinerary, leg, new_legs, time, wait_time, _i, _j, _len, _len1, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    _ref2 = ((_ref1 = data.plan) != null ? _ref1.itineraries : void 0) || [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      itinerary = _ref2[_i];
      new_legs = [];
      time = itinerary.startTime;
      _ref3 = itinerary.legs;
      for (index = _j = 0, _len1 = _ref3.length; _j < _len1; index = ++_j) {
        leg = _ref3[index];
        leg.endTime = leg.startTime + leg.duration;
        if (leg.mode === "WALK") {
          leg.from = {
            lat: leg.legGeometry.points[0][0] * 1e-5,
            lon: leg.legGeometry.points[0][1] * 1e-5,
            name: typeof legs !== "undefined" && legs !== null ? legs[index - 1].to.name : void 0
          };
          leg.to = {
            lat: _.last(leg.legGeometry.points)[0] * 1e-5,
            lon: _.last(leg.legGeometry.points)[1] * 1e-5,
            name: typeof legs !== "undefined" && legs !== null ? legs[index + 1].from.name : void 0
          };
        }
        if (citynavi.config.id === "helsinki") {
          if ((_ref4 = leg.routeId) != null ? _ref4.match(/^1019/) : void 0) {
            _ref5 = ["FERRY", 4], leg.mode = _ref5[0], leg.routeType = _ref5[1];
            leg.route = "Ferry";
          } else if ((_ref6 = leg.routeId) != null ? _ref6.match(/^1300/) : void 0) {
            _ref7 = ["SUBWAY", 1], leg.mode = _ref7[0], leg.routeType = _ref7[1];
            leg.route = "Metro";
          } else if ((_ref8 = leg.routeId) != null ? _ref8.match(/^300/) : void 0) {
            _ref9 = ["RAIL", 2], leg.mode = _ref9[0], leg.routeType = _ref9[1];
          } else if ((_ref10 = leg.routeId) != null ? _ref10.match(/^10(0|10)/) : void 0) {
            _ref11 = ["TRAM", 0], leg.mode = _ref11[0], leg.routeType = _ref11[1];
          } else if (leg.mode !== "WALK") {
            _ref12 = ["BUS", 3], leg.mode = _ref12[0], leg.routeType = _ref12[1];
          }
        }
        if (leg.startTime - time > 1000) {
          wait_time = leg.startTime - time;
          time = leg.endTime;
          new_legs.push(create_wait_leg(leg.startTime - wait_time, wait_time, leg.legGeometry.points[0], leg.from.name));
        }
        new_legs.push(leg);
        time = leg.endTime;
      }
      itinerary.legs = new_legs;
    }
    return data;
  };

  find_route_offline = function(source, target, callback) {
    $.mobile.loading('show');
    return window.citynavi.reach.find(source, target, function(itinerary) {
      var data;
      $.mobile.loading('hide');
      if (itinerary) {
        data = {
          plan: {
            itineraries: [itinerary]
          }
        };
      } else {
        data = {
          plan: {
            itineraries: []
          }
        };
      }
      data = offline_cleanup(data);
      display_route_result(data);
      if (callback) {
        callback(routeLayer);
      }
      return $.mobile.changePage("#map-page");
    });
  };

  otp_cleanup = function(data) {
    var itinerary, last, leg, legs, length, new_legs, time, wait_time, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
    _ref2 = ((_ref1 = data.plan) != null ? _ref1.itineraries : void 0) || [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      itinerary = _ref2[_i];
      legs = itinerary.legs;
      length = legs.length;
      last = length - 1;
      if (!legs[0].routeType && legs[0].startTime !== itinerary.startTime) {
        legs[0].startTime = itinerary.startTime;
        legs[0].duration = legs[0].endTime - legs[0].startTime;
      }
      if (!legs[last].routeType && legs[last].endTime !== itinerary.endTime) {
        legs[last].endTime = itinerary.endTime;
        legs[last].duration = legs[last].endTime - legs[last].startTime;
      }
      new_legs = [];
      time = itinerary.startTime;
      _ref3 = itinerary.legs;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        leg = _ref3[_j];
        leg.legGeometry.points = decode_polyline(leg.legGeometry.points, 2);
        if (leg.startTime - time > 1000 && leg.routeType === null) {
          wait_time = leg.startTime - time;
          time = leg.endTime;
          leg.startTime -= wait_time;
          leg.endTime -= wait_time;
          new_legs.push(leg);
          new_legs.push(create_wait_leg(leg.endTime, wait_time, _.last(leg.legGeometry.points), leg.to.name));
        } else if (leg.startTime - time > 1000) {
          wait_time = leg.startTime - time;
          time = leg.endTime;
          new_legs.push(create_wait_leg(leg.startTime - wait_time, wait_time, leg.legGeometry.points[0], leg.from.name));
          new_legs.push(leg);
        } else {
          new_legs.push(leg);
          time = leg.endTime;
        }
      }
      itinerary.legs = new_legs;
    }
    return data;
  };

  find_route = function(source, target, callback) {
    var find_route_impl;
    console.log("find_route", source.toString(), target.toString(), callback != null);
    if (window.citynavi.reach != null) {
      find_route_impl = find_route_offline;
    } else {
      find_route_impl = find_route_otp;
    }
    find_route_impl(source, target, callback);
    return console.log("find_route done");
  };

  find_route_otp = function(source, target, callback) {
    var $modes, mode, params, _i, _len;
    params = {
      toPlace: "" + target.lat + "," + target.lng,
      fromPlace: "" + source.lat + "," + source.lng,
      minTransferTime: 180,
      walkSpeed: 1.17,
      maxWalkDistance: 100000,
      numItineraries: 3
    };
    if (!$('[name=usetransit]').attr('checked')) {
      params.mode = $("input:checked[name=vehiclesettings]").val();
    } else {
      params.mode = "FERRY," + $("input:checked[name=vehiclesettings]").val();
      $modes = $("#modesettings input:checked");
      if ($modes.length === 0) {
        $modes = $("#modesettings input");
      }
      for (_i = 0, _len = $modes.length; _i < _len; _i++) {
        mode = $modes[_i];
        params.mode = $(mode).attr('name') + "," + params.mode;
      }
    }
    if ($('#wheelchair').attr('checked')) {
      params.wheelchair = "true";
    }
    if ($('#prefer-free').attr('checked') && citynavi.config.id === "manchester") {
      params.preferredRoutes = "GMN_1,GMN_2,GMN_3";
    }
    return $.getJSON(citynavi.config.otp_base_url + "plan", params, function(data) {
      console.log("opentripplanner callback got data");
      data = otp_cleanup(data);
      display_route_result(data);
      if (callback) {
        callback(routeLayer);
      }
      $.mobile.changePage("#map-page");
      return console.log("opentripplanner callback done");
    });
  };

  display_route_result = function(data) {
    var $list, i, index, itinerary, maxDuration, polylines, _i, _len, _ref1, _ref2;
    if ((_ref1 = data.error) != null ? _ref1.msg : void 0) {
      $('#error-popup p').text(data.error.msg);
      $('#error-popup').popup();
      $('#error-popup').popup('open');
      return;
    }
    window.route_dbg = data;
    if (routeLayer !== null) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    routeLayer = L.featureGroup().addTo(map);
    maxDuration = _.max((function() {
      var _i, _len, _ref2, _results;
      _ref2 = data.plan.itineraries;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        i = _ref2[_i];
        _results.push(i.duration);
      }
      return _results;
    })());
    _ref2 = [0, 1, 2];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      index = _ref2[_i];
      $list = $(".route-buttons-" + index);
      $list.empty();
      $list.hide();
      $list.parent().removeClass("active");
      if (index in data.plan.itineraries) {
        itinerary = data.plan.itineraries[index];
        if (index === 0) {
          polylines = render_route_layer(itinerary, routeLayer);
          $list.parent().addClass("active");
        } else {
          polylines = null;
        }
        $list.css('width', itinerary.duration / maxDuration * 100 + "%");
        render_route_buttons($list, itinerary, routeLayer, polylines);
      }
    }
    return resize_map();
  };

  render_route_layer = function(itinerary, routeLayer) {
    var leg, legs, route_includes_transit, sum, total_walking_distance, total_walking_duration, _i, _len, _results;
    legs = itinerary.legs;
    vehicles = [];
    previous_positions = [];
    sum = function(xs) {
      return _.reduce(xs, (function(x, y) {
        return x + y;
      }), 0);
    };
    total_walking_distance = sum((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = legs.length; _i < _len; _i++) {
        leg = legs[_i];
        if (leg.distance && (leg.routeType == null)) {
          _results.push(leg.distance);
        }
      }
      return _results;
    })());
    total_walking_duration = sum((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = legs.length; _i < _len; _i++) {
        leg = legs[_i];
        if (leg.distance && (leg.routeType == null)) {
          _results.push(leg.duration);
        }
      }
      return _results;
    })());
    route_includes_transit = _.any((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = legs.length; _i < _len; _i++) {
        leg = legs[_i];
        _results.push(leg.routeType != null);
      }
      return _results;
    })());
    $('.control-details').html("<div class='route-details'><div>Itinerary total:&nbsp;&nbsp; &nbsp;&nbsp;<i><img src='static/images/clock.svg'> " + Math.ceil(itinerary.duration / 1000 / 60) + "min<\/i>&nbsp;&nbsp; &nbsp;&nbsp;<i><img src='static/images/walking.svg'> " + Math.ceil(total_walking_duration / 1000 / 60) + "min / " + Math.ceil(total_walking_distance / 100) / 10 + "km<\/i></div></div>");
    _results = [];
    for (_i = 0, _len = legs.length; _i < _len; _i++) {
      leg = legs[_i];
      _results.push((function(leg) {
        var color, dashArray, icon, label, last_stop, marker, point, points, polyline, secondsCounter, stop, uid, _ref1, _ref2, _ref3;
        uid = Math.floor(Math.random() * 1000000);
        points = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = leg.legGeometry.points;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            point = _ref1[_j];
            _results1.push(new L.LatLng(point[0] * 1e-5, point[1] * 1e-5));
          }
          return _results1;
        })();
        color = google_colors[(_ref1 = leg.routeType) != null ? _ref1 : leg.mode];
        if (leg.routeType !== null) {
          dashArray = null;
        } else {
          dashArray = "5,10";
          color = "#000";
        }
        polyline = new L.Polyline(points, {
          color: color,
          weight: 8,
          opacity: 0.2,
          clickable: false,
          dashArray: dashArray
        });
        polyline.addTo(routeLayer);
        polyline = new L.Polyline(points, {
          color: color,
          opacity: 0.4,
          dashArray: dashArray
        }).on('click', function(e) {
          map.fitBounds(polyline.getBounds());
          if (typeof marker !== "undefined" && marker !== null) {
            return marker.openPopup();
          }
        });
        polyline.addTo(routeLayer);
        if (true) {
          stop = leg.from;
          last_stop = leg.to;
          point = {
            y: stop.lat,
            x: stop.lon
          };
          icon = L.divIcon({
            className: "navigator-div-icon"
          });
          label = "<span style='font-size: 24px;'><img src='static/images/" + google_icons[(_ref2 = leg.routeType) != null ? _ref2 : leg.mode] + "' style='vertical-align: sub; height: 24px'/><span>" + leg.route + "</span></span>";
          secondsCounter = function() {
            var duration, hours, minutes, seconds, sign;
            if (leg.startTime >= moment()) {
              duration = moment.duration(leg.startTime - moment());
              sign = "";
            } else {
              duration = moment.duration(moment() - leg.startTime);
              sign = "-";
            }
            seconds = (duration.seconds() + 100).toString().substring(1);
            minutes = duration.minutes();
            hours = duration.hours() + 24 * duration.days();
            if (hours > 0) {
              minutes = (minutes + 100).toString().substring(1);
              minutes = "" + hours + ":" + minutes;
            }
            $("#counter" + uid).text("" + sign + minutes + ":" + seconds);
            return setTimeout(secondsCounter, 1000);
          };
          marker = L.marker(new L.LatLng(point.y, point.x), {
            icon: icon
          }).addTo(routeLayer).bindPopup("<b>Time: " + (moment(leg.startTime).format("HH:mm")) + "&mdash;" + (moment(leg.endTime).format("HH:mm")) + "</b><br /><b>From:</b> " + (stop.name || "") + "<br /><b>To:</b> " + (last_stop.name || ""));
          if ((leg.routeType != null) || leg === legs[0]) {
            marker.bindLabel(label + ("<span id='counter" + uid + "' class='counter firstleg" + (leg === legs[0]) + " transitroute" + route_includes_transit + "'></span>"), {
              noHide: true
            }).showLabel();
            secondsCounter();
          }
        }
        if (leg.routeType != null) {
          $.getJSON(citynavi.config.otp_base_url + "transit/variantForTrip", {
            tripId: leg.tripId,
            tripAgency: leg.agencyId
          }, function(data) {
            var geometry, line_layer;
            geometry = data.geometry;
            points = (function() {
              var _j, _len1, _ref3, _results1;
              _ref3 = decode_polyline(geometry.points, 2);
              _results1 = [];
              for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                point = _ref3[_j];
                _results1.push(new L.LatLng(point[0] * 1e-5, point[1] * 1e-5));
              }
              return _results1;
            })();
            line_layer = new L.Polyline(points, {
              color: color,
              opacity: 0.2
            });
            return line_layer.addTo(routeLayer);
          });
          console.log("subscribing to " + leg.routeId);
          if ((_ref3 = citynavi.realtime) != null) {
            _ref3.subscribe_route(leg.routeId, function(msg) {
              var id, interpolation, old_pos, pos, steps, _ref4;
              id = msg.vehicle.id;
              pos = [msg.position.latitude, msg.position.longitude];
              if (!(id in vehicles)) {
                icon = L.divIcon({
                  className: "navigator-div-icon",
                  html: "<img src='static/images/" + google_icons[(_ref4 = leg.routeType) != null ? _ref4 : leg.mode] + "' height='20px' />"
                });
                vehicles[id] = L.marker(pos, {
                  icon: icon
                }).addTo(routeLayer);
                console.log("new vehicle " + id + " on route " + leg.routeId);
              } else {
                old_pos = previous_positions[id];
                steps = 30;
                interpolation = function(index, id, old_pos) {
                  var lat, lng;
                  lat = old_pos[0] + (pos[0] - old_pos[0]) * (index / steps);
                  lng = old_pos[1] + (pos[1] - old_pos[1]) * (index / steps);
                  vehicles[id].setLatLng([lat, lng]);
                  if (index < steps) {
                    return interpolations[id] = setTimeout((function() {
                      return interpolation(index + 1, id, old_pos);
                    }), 1000);
                  } else {
                    return interpolations[id] = null;
                  }
                };
                if (previous_positions[id][0] !== pos[0] || previous_positions[id][1] !== pos[1]) {
                  if (interpolations[id]) {
                    clearTimeout(interpolations[id]);
                  }
                  interpolation(1, id, old_pos);
                }
              }
              return previous_positions[id] = pos;
            });
          }
        }
        return polyline;
      })(leg));
    }
    return _results;
  };

  render_route_buttons = function($list, itinerary, route_layer, polylines) {
    var $end, $full_trip, $start, index, leg, length, max_duration, trip_duration, trip_start, _fn, _i, _len, _ref1;
    trip_duration = itinerary.duration;
    trip_start = itinerary.startTime;
    length = itinerary.legs.length + 1;
    $full_trip = $("<li class='leg'><div class='leg-bar' style='margin-right: 3px'><i style='font-weight: lighter'><img />Total</i><div class='leg-indicator'>" + (Math.ceil(trip_duration / 1000 / 60)) + "min</div></div></li>");
    $full_trip.css("left", "{0}%");
    $full_trip.css("width", "{5}%");
    $full_trip.click(function(e) {
      map.fitBounds(route_layer.getBounds());
      sourceMarker.closePopup();
      targetMarker.closePopup();
      return sourceMarker.openPopup();
    });
    $start = $("<li class='leg'><div class='leg-bar'><i><img src='static/images/walking.svg' height='100%' style='visibility: hidden' /></i><div class='leg-indicator' style='font-style: italic; text-align: left'>" + (moment(trip_start).format("HH:mm")) + "</div></div></li>");
    $start.css("left", "" + 0 + "%");
    $start.css("width", "" + 10 + "%");
    $list.append($start);
    $end = $("<li class='leg'><div class='leg-bar'><i><img src='static/images/walking.svg' height='100%' style='visibility: hidden' /></i><div class='leg-indicator' style='font-style: italic; text-align: right'>" + (moment(trip_start + trip_duration).format("HH:mm")) + "</div></div></li>");
    $end.css("right", "" + 0 + "%");
    $end.css("width", "" + 10 + "%");
    $list.append($end);
    max_duration = trip_duration;
    _ref1 = itinerary.legs;
    _fn = function(index) {
      var $leg, color, icon_name, leg_duration, leg_label, leg_start, leg_subscript, _ref2, _ref3;
      if (leg.mode === "WALK" && $('#wheelchair').attr('checked')) {
        icon_name = "wheelchair.svg";
      } else {
        icon_name = google_icons[(_ref2 = leg.routeType) != null ? _ref2 : leg.mode];
      }
      color = google_colors[(_ref3 = leg.routeType) != null ? _ref3 : leg.mode];
      leg_start = (leg.startTime - trip_start) / max_duration;
      leg_duration = leg.duration / max_duration;
      leg_label = "<img src='static/images/" + icon_name + "' height='100%' />";
      if ((leg.routeType == null) && (leg.distance != null) && leg_duration > 0.2) {
        leg_subscript = "<div class='leg-indicator' style='font-weight: normal'>" + (Math.ceil(leg.distance / 100) / 10) + "km</div>";
      } else {
        leg_subscript = "<div class='leg-indicator'>" + leg.route + "</div>";
      }
      $leg = $("<li class='leg'><div style='background: " + color + ";' class='leg-bar'><i>" + leg_label + "</i>" + leg_subscript + "</div></li>");
      $leg.css("left", "" + (leg_start * 100) + "%");
      $leg.css("width", "" + (leg_duration * 100) + "%");
      $leg.click(function(e) {
        if ($list.parent().filter('.active').length > 0) {
          return polylines[index].fire("click");
        } else {
          routeLayer.eachLayer(function(layer) {
            return routeLayer.removeLayer(layer);
          });
          $list.parent().siblings().removeClass('active');
          polylines = render_route_layer(itinerary, routeLayer);
          $list.parent().addClass('active');
          return map.fitBounds(routeLayer.getBounds());
        }
      });
      $leg.find('i').click(function(e) {
        return polylines[index].fire("click");
      });
      return $list.append($leg);
    };
    for (index = _i = 0, _len = _ref1.length; _i < _len; index = ++_i) {
      leg = _ref1[index];
      _fn(index);
    }
    return $list.show();
  };

  find_route_reittiopas = function(source, target, callback) {
    var params;
    params = {
      request: "route",
      detail: "full",
      epsg_in: "wgs84",
      epsg_out: "wgs84",
      from: "" + source.lng + "," + source.lat,
      to: "" + target.lng + "," + target.lat
    };
    return $.getJSON(reittiopas_url, params, function(data) {
      var leg, legs, route, _fn, _i, _len;
      window.route_dbg = data;
      if (routeLayer !== null) {
        map.removeLayer(routeLayer);
        routeLayer = null;
      } else {
        map.removeLayer(layers["osm"]);
        map.addLayer(layers["cloudmade"]);
      }
      route = L.featureGroup().addTo(map);
      routeLayer = route;
      legs = data[0][0].legs;
      _fn = function() {
        var color, last_stop, marker, point, points, polyline, stop;
        points = (function() {
          var _j, _len1, _ref1, _results;
          _ref1 = leg.shape;
          _results = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            point = _ref1[_j];
            _results.push(new L.LatLng(point.y, point.x));
          }
          return _results;
        })();
        color = transport_colors[leg.type];
        polyline = new L.Polyline(points, {
          color: color
        }).on('click', function(e) {
          map.fitBounds(e.target.getBounds());
          if (typeof marker !== "undefined" && marker !== null) {
            return marker.openPopup();
          }
        });
        polyline.addTo(route);
        if (leg.type !== 'walk') {
          stop = leg.locs[0];
          last_stop = leg.locs[leg.locs.length - 1];
          point = leg.shape[0];
          return marker = L.marker(new L.LatLng(point.y, point.x)).addTo(route).bindPopup("<b><Time: " + (format_time(stop.depTime)) + "</b><br /><b>From:</b> {stop.name}<br /><b>To:</b> " + last_stop.name);
        }
      };
      for (_i = 0, _len = legs.length; _i < _len; _i++) {
        leg = legs[_i];
        _fn();
      }
      if (!map.getBounds().contains(route.getBounds())) {
        return map.fitBounds(route.getBounds());
      }
    });
  };

  resize_map = function() {
    var attr_height, attr_width, height;
    console.log("resize_map");
    height = window.innerHeight - $('#map-page [data-role=footer]').height() - 0;
    console.log("#map height", height);
    attr_width = height - 10;
    $('.leaflet-control-attribution').css('width', attr_width + "px");
    attr_height = $('.leaflet-control-attribution').height();
    console.log(".leaflet-control-attribution height", attr_height);
    $('.leaflet-control-attribution').css('left', attr_width / 2 - attr_height / 8 + "px");
    return $('.leaflet-control-attribution').css('top', -attr_width / 2 - attr_height / 2 + "px");
  };

  $(window).on('resize', function() {
    return resize_map();
  });

  window.map_dbg = map = L.map('map', {
    minZoom: citynavi.config.min_zoom,
    zoomControl: false,
    attributionControl: false
  }).setView(citynavi.config.center, citynavi.config.min_zoom);

  $(document).ready(function() {
    resize_map();
    return map.invalidateSize();
  });

  DetailsControl = L.Control.extend({
    options: {
      position: 'topleft'
    },
    onAdd: function(map) {
      var $container;
      $container = $("<div class='control-details'></div>");
      return $container.get(0);
    }
  });

  new DetailsControl().addTo(map);

  new DetailsControl({
    position: 'topright'
  }).addTo(map);

  L.control.attribution({
    position: 'bottomright'
  }).addTo(map);

  if (!window.testem_mode) {
    map.locate({
      setView: false,
      maxZoom: 15,
      watch: true,
      timeout: Infinity,
      enableHighAccuracy: true
    });
  }

  create_tile_layer = function(map_config) {
    return L.tileLayer(map_config.url_template, map_config.opts);
  };

  _ref1 = citynavi.config.maps;
  for (key in _ref1) {
    value = _ref1[key];
    layers[key] = create_tile_layer(value);
  }

  layers["cloudmade"].addTo(map);

  osmnotes = new leafletOsmNotes();

  fillarikanava = new leafletFillarikanava();

  control_layers = {};

  _ref2 = citynavi.config.maps;
  for (key in _ref2) {
    value = _ref2[key];
    control_layers[value.name] = layers[key];
  }

  L.control.layers(control_layers, {
    "View map errors": osmnotes,
    "Fillarikanava": fillarikanava
  }).addTo(map);

  L.control.scale().addTo(map);

  BackControl = L.Control.extend({
    options: {
      position: 'topleft'
    },
    onAdd: function(map) {
      var $button, $container;
      $container = $("<div id='back-control'>");
      $button = $("<a href='' data-role='button' data-rel='back' data-icon='arrow-l' data-mini='true'>Back</a>");
      $button.on('click', function(e) {
        e.preventDefault();
        if (history.length < 2) {
          $.mobile.changePage("#front-page");
        } else {
          history.back();
        }
        return false;
      });
      $container.append($button);
      return $container.get(0);
    }
  });

  L.control.zoom().addTo(map);

  TRANSFORM_MAP = [
    {
      source: {
        lat: 53.477342,
        lng: -2.2584626
      },
      dest: {
        lat: 53.477958,
        lng: -2.23342
      }
    }
  ];

  transform_location = function(point) {
    var current, radius, src_pnt, t, _i, _len;
    for (_i = 0, _len = TRANSFORM_MAP.length; _i < _len; _i++) {
      t = TRANSFORM_MAP[_i];
      src_pnt = new L.LatLng(t.source.lat, t.source.lng);
      current = new L.LatLng(point.lat, point.lng);
      radius = 100;
      if (src_pnt.distanceTo(current) < radius) {
        point.lat = t.dest.lat;
        point.lng = t.dest.lng;
        return;
      }
    }
  };

  map.on('locationerror', function(e) {
    return alert(e.message);
  });

  map.on('locationfound', function(e) {
    var bbox_ne, bbox_sw, measure, point, popup, radius, zoom, _ref3, _ref4;
    radius = e.accuracy;
    measure = e.accuracy < 2000 ? "within " + (Math.round(e.accuracy)) + " meters" : "within " + (Math.round(e.accuracy / 1000)) + " km";
    point = e.latlng;
    transform_location(point);
    bbox_sw = citynavi.config.bbox_sw;
    bbox_ne = citynavi.config.bbox_ne;
    if (!((bbox_sw[0] < (_ref3 = point.lat) && _ref3 < bbox_ne[0])) || !((bbox_sw[1] < (_ref4 = point.lng) && _ref4 < bbox_ne[1]))) {
      if (sourceMarker !== null) {
        if (positionMarker !== null) {
          map.removeLayer(positionMarker);
          map.removeLayer(positionMarker2);
          positionMarker = null;
        }
        return;
      }
      console.log(bbox_sw[0], point.lat, bbox_ne[0]);
      console.log(bbox_sw[1], point.lng, bbox_ne[1]);
      console.log("using area center instead of geolocation outside area");
      point.lat = citynavi.config.center[0];
      point.lng = citynavi.config.center[1];
      e.accuracy = 2001;
      radius = 50;
      measure = "nowhere near";
      e.bounds = L.latLngBounds(bbox_sw, bbox_ne);
    }
    position_point = point;
    position_bounds = e.bounds;
    citynavi.set_source_location([point.lat, point.lng]);
    if (positionMarker !== null) {
      map.removeLayer(positionMarker);
      map.removeLayer(positionMarker2);
      positionMarker = null;
    } else if (sourceMarker === null) {
      zoom = Math.min(map.getBoundsZoom(e.bounds), 15);
      map.setView(point, zoom);
      popup = $.mobile.activePage.attr("id") !== "front-page";
      set_source_marker(point, {
        accuracy: radius,
        measure: measure,
        popup: popup
      });
    }
    if (e.accuracy > 2000) {
      return;
    }
    positionMarker = L.circle(point, radius, {
      color: 'red',
      weight: 1,
      opacity: 0.4
    }).addTo(map).on('click', function(e) {
      return set_source_marker(point, {
        accuracy: radius,
        measure: measure
      });
    });
    return positionMarker2 = L.circleMarker(point, {
      radius: 7,
      color: 'red',
      weight: 2,
      fillOpacity: 1
    }).addTo(map).on('click', function(e) {
      return set_source_marker(point, {
        accuracy: radius,
        measure: measure
      });
    });
  });

  map.on('click', function(e) {
    if ((sourceMarker != null) && (targetMarker != null)) {
      return;
    }
    if (sourceMarker === null) {
      return set_source_marker(e.latlng, {
        popup: true
      });
    } else if (targetMarker === null) {
      return set_target_marker(e.latlng);
    }
  });

  contextmenu = L.popup().setContent('<a href="#" onclick="return setMapSource()">Set source</a> | <a href="#" onclick="return setMapTarget()">Set target</a> | <a href="#" onclick="return setNoteLocation()">Report map error</a>');

  set_comment_marker = function(latlng) {
    var description;
    if (commentMarker != null) {
      map.removeLayer(commentMarker);
      commentMarker = null;
    }
    if (latlng == null) {
      return;
    }
    commentMarker = L.marker(latlng, {
      draggable: true
    }).addTo(map);
    description = typeof options !== "undefined" && options !== null ? options.description : void 0;
    if (description == null) {
      description = "Location for map error report";
    }
    return commentMarker.bindPopup(description).openPopup();
  };

  map.on('contextmenu', function(e) {
    contextmenu.setLatLng(e.latlng);
    contextmenu.openOn(map);
    window.setMapSource = function() {
      set_source_marker(e.latlng);
      map.removeLayer(contextmenu);
      return false;
    };
    window.setMapTarget = function() {
      set_target_marker(e.latlng);
      map.removeLayer(contextmenu);
      return false;
    };
    return window.setNoteLocation = function() {
      set_comment_marker(e.latlng);
      osmnotes.addTo(map);
      $('#comment-box').show();
      $('#comment-box').unbind('submit');
      $('#comment-box').bind('submit', function() {
        var lat, lon, text, uri;
        text = $('#comment-box textarea').val();
        lat = commentMarker.getLatLng().lat;
        lon = commentMarker.getLatLng().lng;
        uri = osm_notes_url;
        $.post(uri, {
          lat: lat,
          lon: lon,
          text: text
        }, function() {
          $('#comment-box').hide();
          resize_map();
          return set_comment_marker();
        });
        return false;
      });
      resize_map();
      map.removeLayer(contextmenu);
      return false;
    };
  });

}).call(this);
