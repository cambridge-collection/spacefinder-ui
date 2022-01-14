var map,
    jquery = jQuery,
    $list = $('#list'),
    $map = $('#map'),
    openPoints = [],
    loc = {'lat': 52.205575, 'lng': 0.121682},
    userLoc = {'lat': 0, 'lng': 0}, //52.2050683,0.1077597
    getLocation = false,
    centerOnLocation = false,
    points = [],
    listScroll = 0,
    currView = 'small',
    currWidth = 0,
    loginWindow,
    currentZoom = 14,
    currentLoc = loc,
    systemEvent = false,
    loadSpacesInProgress = false,
    spacesRequest = null,
    totalSpaceCount = 0,
    queryLimit = 35,
    lastQuery = '',
    exclude = {
        'exclusions': [],
        'total': 0
    },
    mapOptions = {
        center: loc,
        zoom: 20,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    },
    oldView = undefined,
    currViewHash = undefined,
    inactiveColor = 'rgba(0,0,0,1)',
    activeColor = '#D6083B',
    initialView = 'map',
    cancelGeoLocation = false,
    view = '',
    mapViewed = false;
    
var markerSymbol = {
    path: 'M0-30.5c-5.7,0-10.2,4.6-10.2,10.2C-10.2-14.6,0,0,0,0s10.2-14.6,10.2-20.2C10.2-25.9,5.7-30.5,0-30.5z M0-17.7c-1.6,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S1.6-17.7,0-17.7z',
    fillColor: inactiveColor,
    fillOpacity: 1,
    scale: 1,
    strokeWeight: 0
};

var multiMarkerSymbol = {
    path: 'M0-28.5c-5.7,0-10.2,4.6-10.2,10.2C-10.2-12.6,0,0,0,0s10.2-12.6,10.2-18.2C10.2-23.9,5.7-28.5,0-28.5z M5.2-17.8h-4v4h-2.4v-4h-4v-2.4h4v-4h2.4v4h4V-17.8z',
    fillColor: inactiveColor,
    fillOpacity: 1,
    scale: 1,
    strokeWeight: 0
};
$().ready(function () {
    //alert($(body).hasClass('flexbox'));
    resetViews();

    $(window).on('initialLoadComplete', function (event) {
        event.preventDefault();
        $('.loading-cover .message').html('finalising');
        if ($('.loading-cover').length > 0 && !!$('html').hasClass('flexbox')) {
            $('.loading-cover').addClass('loaded');
            window.setTimeout(function () {
                $('.loading-cover').remove();
            }, 500);
        } else {
            $('.loading-cover').html("<p>It appears you are using an outdated browser. If possible switch to a newer one as some things may not look as they should or are missing. To continue into the app please click below</p><p><a href=\"#\" id=\"old-continue\">Continue</a></p>")
            $('#old-continue').on('click', function (event) {
                event.preventDefault();
                $('.loading-cover').addClass('loaded').fadeOut(300, function () {
                    $(this).remove();
                });
            });
        }
    });

    if (!$('html').hasClass('flexbox')) {
        $('head').append('<link  rel="stylesheet" type="text/css" href="/assets/css/old.css" />');
    }
    var iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
    if (iOS !== null && $(window).width() > 1000) {
        //alert('detected ios');
        $('.view-container').each(function () {
            var $this = $(this);
            $this.height($(window).height() - ($('#top-bar').outerHeight(true)));
            if ($this.attr('id') == 'search') {
                $this.height($(window).height() - ($('#top-bar').outerHeight(true) + 60));
            }
        });
        $(window).on('scroll', function (event) {
            event.preventDefault();
            $('body').stop().animate({scrollTop: 0}, 10)
        });
    }
    $('#search-btn').on('click touchstart', function (event) {
        if (currView == 'large') {
            event.preventDefault();
            console.log('search clicked');
            if ($(this).hasClass('active')) {
                $('#search').hide(0);
                $(this).removeClass('active')
            } else {
                $('#search').show(0);
                $(this).addClass('active')
            }
            $(window).resize();
            $('div[id^=space-]').css({
                'left': $list.offset().left,
                'width': $list.width()
            });
            systemEvent = true;
            google.maps.event.trigger(map, 'resize')
        }
    });

    var startView = initialView;
    $(window).on('hashchange', function (Event) {
        //console.log('hashchange');
        if (Event.originalEvent.oldURL !== undefined) {
            oldView = Event.originalEvent.oldURL.split('#')[1];
        } else {
            if (currViewHash !== undefined) {
                oldView = currViewHash
            }
        }
        console.log(oldView);
        currViewHash = view = window.location.hash.substr(1);
        if (view.substr(0, 1) != '/') {
            return false;
        } else if (view == '/') {
            window.location.hash = '/' + initialView;
        }
        view = view.substr(1);
        console.log('switch view - ' + view);
        switchView(view);
    });

    if (window.location.hash !== "" && initialView !== window.location.hash) {
        view = window.location.hash.substr(1);
        if (view.substr(0, 1) != '/') {
            return false;
        }
        view = view.substr(1);
        startView = view;
    }
    $('.current-status').html('templates');
    loadTemplates({
        data: templates,
        callback: function () {
            $('.current-status').html('spaces');
            loadSpaces({
                //location:loc,
                callback: function () {
                    //$('.current-status').html('switch view');
                    switchView(startView);
                }
            });
            /*if ("geolocation" in navigator && !!getLocation && userLoc.lat == 0 && userLoc.lng == 0) {
            //console.log('get user location');
            $('.current-status').html('location');
            navigator.geolocation.getCurrentPosition(function(position) {
            if(cancelGeoLocation == false) {
            cancelGeoLocation = null;
            userLoc.lat = position.coords.latitude;
            userLoc.lng = position.coords.longitude;
            //set the center of the map on users current location
            $('.current-status').html('spaces');
            loadSpaces({
            location:userLoc,
            callback:function() {
            switchView(startView);
        }
    });
}

}, function () {
if(cancelGeoLocation == false) {
cancelGeoLocation = null;
getLocation = false;
$('.current-status').html('spaces');
loadSpaces({
location:loc,
callback:function() {
switchView(startView);
}
});
}
}, {
enableHighAccuracy: false,
timeout: 5000,
maximumAge: 0
});
window.setTimeout(function () {
if (cancelGeoLocation !== null) {
getLocation = false;
cancelGeoLocation = true;
$('.current-status').html('spaces');
loadSpaces({
location:loc,
callback:function() {
switchView(startView);
}
});
}

}, 8000)
} else {
$('.current-status').html('spaces');
loadSpaces({
location:loc,
callback:function() {
switchView(startView);
}
});
}*/
        }
    })
    moment.locale('en', {
        relativeTime: {
            future: "in %s",
            past: "%s",
            s: "seconds",
            m: "a minute",
            mm: "%d m",
            h: "an hour",
            hh: "%d h",
            d: "a day",
            dd: "%d d",
            M: "a month",
            MM: "%d m",
            y: "a year",
            yy: "%d y"
        }
    });

    $(window).on('resize orientationchange', resize);

    $(window).trigger('resize');


    $(window).on('login_success', function (event) {
        event.preventDefault();
        //console.log('login successful');
        $('.login-screen').fadeOut(300, function () {
            $(this).remove();
        });
    });
});
function resize(event) {
    systemEvent = true;
    event.preventDefault();
    currWidth = $(window).width();
    $('div[id^=space-]').width($list.width()).css('left', $list.offset().left);
    if (currWidth < 1000 && currView !== 'small') {
        resizeForMobile();
        $(window).trigger('layout');
    } else if (currWidth > 1000 && currView !== 'large') {
        resizeForDesktop();
        $(window).trigger('layout');
    }
    if (map !== undefined && openPoints.length == 0) {

        if (!!centerOnLocation) {
            map.setCenter(userLoc);
        } else {
            map.setCenter(loc);
        }

    }
    var iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
    if (iOS !== null && currView == 'large') {
        $('.view-container').each(function () {
            var $this = $(this);
            //$this.height($(window).height() - ($('#top-bar').height()+ 60));
        });
    }
    $list.find('.list-meta').width($list.width());
}
function resizeForMobile() {
    currView = 'small';
    $('body').removeClass('large_view')
    $('#top-bar').find('a[href!="#/search"]').show(0);
    $('#search-btn').removeClass('active');
    $('div[id^=space-]').css({
        'left': 0,
        'top': 0,
        'width': '100%'
    });
}
function resizeForDesktop() {
    currView = 'large';
    $('body').addClass('large_view')
    $('#top-bar').find('> a[href!="#/search"]').hide(0);
    $('#map').show(0);
    $('#search-btn').addClass('active');
    $('#search').show();
    $('div[id^=space-]').css({
        'left': $list.offset().left,
        'top': 0,
        'width': $list.width()
    });
    if (map !== undefined) {
        /*map.setZoom(14);
        if(openPoints.length > 0) {
        for (var i = 0; i < openPoints.length; i++) {
        points[openPoints[i]].mapSummary.close();
        points[openPoints[i]].marker.icon.fillColor = inactiveColor;
        points[openPoints[i]].marker.setMap(map);
        openPoints.splice(i, 1);
    }
}
if(!!centerOnLocation) {
map.setCenter(userLoc);
} else {
map.setCenter(loc);
}*/
    }

}

function switchView(newView, modal) {

    if (oldView == '/list') {
        listScroll = Number($(window).scrollTop());
    }
    if (newView == undefined) newView = initialView;
    closeSpaces();
    if (currView == 'small') $('.view-container').css('position', '');
    if (typeof ga !== "undefined") {
        ga('set', 'page', '/' + newView);
        if (userDetails !== null && userDetails.id > 0) {
            ga('set', 'userId', userDetails.id);
        }
        ga('send', 'pageview');
    }
    if (newView.indexOf('/') == -1 && $('#' + newView).length > 0) {
        if (currView == 'small') {

            $('.view-container').css({'z-index': '0', 'max-height': '90%', 'overflow': 'hidden'});
            $('a:not(#near-me-btn)').removeClass('active');
            $('a[href="#/' + newView + '"]').addClass('active');
            $('.current-status').html('initial view');
            $('#' + newView).css({'z-index': '1', 'max-height': '', 'overflow': 'auto'}).fadeIn({
                duration: 300,
                start: function () {

                    if (newView == 'map') {
                        systemEvent = true;
                        google.maps.event.trigger(map, 'resize');
                        $(window).scrollTop(0);

                    }
                    if (!mapViewed) {
                        mapViewed == true;
                        systemEvent = true;
                        if (!!centerOnLocation) {
                            map.setCenter(userLoc);
                        } else {
                            map.setCenter(loc);
                        }

                    }
                },
                progress: function () {
                    if (newView == 'list') {
                        systemEvent = true;
                        $(window).scrollTop(listScroll);
                        //map.setZoom(currentZoom);
                        //pointsInView();
                    }
                    if (newView == 'map') {
                        if (openPoints.length > 0) {
                            systemEvent = true;
                            new google.maps.event.trigger(points[openPoints[0]].marker, 'click');
                            systemEvent = true;
                            //map.setZoom(currentZoom);
                            //pointsInView();
                        }
                    }
                }
            });
        }
    } else {

        if (newView.indexOf('space') !== -1) {
            if (currView == 'small') $('.view-container').css('position', 'fixed');
            var parts = newView.split('/');
            loadSpace({
                'id': parts[1],
                'name': parts[2].replace('-', ' ')
            })
        }
        //pointsInView();
    }


    /*if(!mapViewed) {
    mapViewed == true;
    if(!!centerOnLocation) {
    map.setCenter(userLoc);
} else {
map.setCenter(loc);
}
}*/
}


function loadSpace(options) {
    var defaults = {},
        space;
    $.extend(defaults, options);
    //see if we've already have it loaded
    space = findMarkers(points, {'id': defaults.id}).spaces;


    if (space.length == 1) {
        //we've got the space so show it
        showSpace(space[0]);
    } else if (space.length == 0) {
        $.ajax({
            url: '/assets/data/unloaded-space.json',
            dataType: 'json',
            data: {id: defaults.id}
        })
            .done(function (data) {
                if ($.type(data) == 'array') {
                    data = data[0];
                }
                showSpace(data);


            })

        //load the space and show it;
    } else {
        //console.log('too many spaces with same ID returned');
    }

}

function showSpace(data) {
    var space = $('<div />')
        .css({'margin-top': $(window).height()})
        .attr('id', 'space-' + data.id)
        .addClass('space-container')
        .append(parseTemplate('spaceDetail', data))
        .insertAfter('#list')
    //.fadeIn(300)

    if (currView == 'large') {
        //$('#list').css('display', 'none');
        space.width($list.width()).css('left', $list.offset().left);
        space.animate({'margin-top': $('#top-bar').outerHeight(true)}, 300);
    } else {
        space.animate({'margin-top': 0}, 300, function () {
            space.find('.title').css('position', 'fixed');
            space.css('overflow', 'auto');
        });
    }
}

function closeSpaces() {
    var spaces = $('div[id^=space-]');
    spaces.css('overflow', 'hidden').find('.title').removeAttr('style');
    $('div[id^=space-]').animate({'margin-top': $(window).height()}, 300, function () {
        $(this).remove();
        if (currView == 'large') $('#list').css('display', 'block');
    });

    if (openPoints.length > 0) {
        for (var i = 0; i < openPoints.length; i++) {
            if (points[openPoints[i]].mapSummary !== undefined) points[openPoints[i]].mapSummary.close();
            //points[openPoints[i]].marker.icon.fillColor = markerColor(points[openPoints[i]].space_type);
            points[openPoints[i]].marker.setZIndex(0);
            points[openPoints[i]].marker.setMap(map);
            openPoints.splice(i, 1);
        }
        for (var i = 0; i < points.length; i++) {
            points[i].marker.setOptions({'opacity': 1});
            points[i].marker.icon.fillColor = markerColor(points[i].space_type);
            points[i].marker.setMap(map);
        }
    }
    if (currView == 'large') {
        systemEvent = true;
        map.setZoom(currentZoom);
        systemEvent = true;
        map.setCenter(currentLoc);
    }

}

function resetViews() {
    systemEvent = true;
    mapOptions.center = currentLoc;
    mapOptions.zoom = currentZoom;
    $map.empty();
    //if (map == undefined || map == null) {
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    //}
    for (var i = 0; i < points.length; i++) {
        points[i].marker.setMap(null);
    }
    //points = []

    $('#list').html('');

    google.maps.event.addListener(map, 'center_changed', function (e) {
        console.log($('div[id^=space-]'));
        if (!systemEvent && $('div[id^=space-]').length == 0) {
            console.log('non system event fired - center');
            var newCenter = map.getCenter();
            currentLoc.lat = newCenter.lat();
            currentLoc.lng = newCenter.lng();
        }

        setTimeout(function () {
            systemEvent = false;
        }, 300);
    });
    google.maps.event.addListener(map, 'bounds_changed', function () {

        if (!systemEvent && $('div[id^=space-]').length == 0 && $('.infoBubble:visible').length == 0) {
            console.log('non system event fired - bounds');
            currentZoom = map.getZoom();

            window.setTimeout(function () {
                exclude = {
                    'exclusions': [],
                    'total': 0
                }

                console.log('*************** firing search-button - click');
                // $('.search-button').trigger('click');
                loadSpaces(
                    {
                        queryString: search,
                        keepData: true,
                        expanded: exclude
                        //clearSpaces:true
                    }
                )
            }, 300);

            pointsInView();
        }
        setTimeout(function () {
            systemEvent = false;
        }, 300);

    });
}

function getSpaces(options, callback) {
    if ( storageAvailable('localStorage') && getWithExpiry('spaces') ) {
        console.log("getting space data from localstorage");
        callback(JSON.parse(getWithExpiry('spaces')));
    } else {
        var spacesURL = window.location.protocol+'//'+window.location.host+'/spaces.json';
        console.log("getting data from API at "+spacesURL);
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function(){
            if ( storageAvailable('localStorage') ) {
                var expires = new Date().getTime() + (24*60*60*1000)
                console.log('storing spaces data - expires '+expires);
                setWithExpiry('spaces', this.responseText, 24);
            }
            callback(JSON.parse(this.responseText));
        });
        oReq.open("GET", spacesURL);
        oReq.send();
    }
}
getSpaces({}, function(data){
    console.log(data);
    getSpaces({}, function(data){
        console.log(data);
    });
});


function loadSpaces(options) {
    var resultsContainer = document.getElementById('list');
    uol_show_loader(resultsContainer);
    getSpaces(options, function(data){
        uol_hide_loader();
    });

    $('.current-status').html('load spaces');
    if (loadSpacesInProgress) {
        return;
    }
    loadSpacesInProgress = true;
    var defaults = {
        location: '',
        queryString: (typeof prepSearch == 'function' ? prepSearch() : ''),
        reset: false,
        keepData: false,
        boundToMap: true,
        expanded: {
            'exclusions': [],
            'total': 0
        }
    };
    $.extend(defaults, options);
    console.log('### load spaces, exclude:' + defaults.expanded.exclusions.join(','));
    /*----load spaces-----*/
    $('#top-bar a[href*=map] i').removeClass('icon-marker').addClass('icon-loading');
    defaults.queryString += '&limit=' + queryLimit;
    /*if(defaults.location !== '') {
    defaults.queryString += '&filters[nearest]=' + defaults.location.lat + ',' + defaults.location.lng;
}*/
//defaults.queryString += '&filters[nearest]=' + userLoc.lat + ',' + userLoc.lng;
    $('.current-status').html('reset');
//if(!defaults.keepData) resetViews();
    $('.current-status').html('complete reset');
//$('.current-status').html(typeof map.getBounds);

    if (!!defaults.boundToMap && typeof map !== 'undefined') {
        var bounds = map.getBounds();
        if (bounds !== undefined) {
            var ne = bounds.getNorthEast();
            var sw = bounds.getSouthWest();
            defaults.queryString += '&filters[bounds][sw]=' + sw.lat() + ',' + sw.lng();
            defaults.queryString += '&filters[bounds][ne]=' + ne.lat() + ',' + ne.lng();
        }

    }

    if (spacesRequest && spacesRequest.readyState != 4) {
        console.log('abort request', spacesRequest);
        spacesRequest.abort();
    }

    if (typeof ga !== "undefined") {
        if (userDetails !== null && userDetails.id > 0) {
            ga('set', 'userId', userDetails.id);
        }
        var qs = defaults.queryString;
        try {
            if ($.type(defaults.queryString) == 'object') {
                qs = $.serialize(defaults.queryString);
            }
        } catch (e) {

        }
        ga('set', 'page', '/search?' + qs);
    }
    lastQuery = defaults.queryString;
    spacesRequest = $.ajax(domain + 'spaces.json?callback=?', {
        cache: false,
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        method: 'GET',
        data: defaults.queryString
    }).complete(function (event, xhr, settings) {
        if (xhr.readyState !== 4) {
            if (typeof (defaults.callback) == 'function') {
                defaults.callback();
            }
            $('#top-bar a[href*=map] i').addClass('icon-marker').removeClass('icon-loading');
        }

    }).success(function (data, status, xhr) {
        if (!!defaults.clearSpaces) {
            for (var i = 0; i < points.length; i++) {
                points[i].marker.setMap(null);
            }
            //points = [];
            $list.html('');
            exclude = {
                'exclusions': [],
                'total': 0
            }
        }
        console.log('success triggered', data, status, xhr);
        //$.getJSON('/assets/data/points.json').done(function(data) {
        console.log('spaces loaded', defaults.queryString, data.results.length);
        if (!!defaults.keepData) {
            var temp = points
            niceExclusions = [];

            for (var i = 0; i < exclude.exclusions.length; i++) {
                switch (exclude.exclusions[i]) {
                    case "noise":
                        niceExclusions.push('noise levels');
                        break;
                    case "atmosphere":
                        niceExclusions.push('atmosphere filters');
                        break;
                    case "work":
                        niceExclusions.push('work environments');
                        break;
                }
            }

            for (var i = 0; i < data.results.length; i++) {
                data.results[i].excluded = niceExclusions;
            }
            points = cleanData(points.concat(data.results));
        } else {
            points = data.results;
        }

        if (points.length == 0) {
            loadMap();
            loadList();
        }

        distCount = 0;
        totalSpaceCount = data.total_count;
        expanding = false;
        if (typeof checkExpansions == 'function' && defaults.queryString.indexOf('page') == -1) {
            checkExpansions();
            expandSearch(defaults.expansionCount);

            if (defaults.expansionCount == undefined) {
                defaults.expansionCount = 0;
            }
            console.log('-----------------------------expanded:', defaults.expanded, exclude, defaults.expansionCount);
            $('.search-expanding').remove();
            if (points.length <= 0 && exclude.total > 0 && defaults.expansionCount <= exclude.total) {
                expanding = true;
                $('#list').append('<div class="search-expanding"><i class="icon-loading" /><br /><p>There were no exact matches. Expanding search...</p>')
                loadSpaces({
                    "queryString": prepSearch(),
                    "keepData": true,
                    "expanded": exclude,
                    "expansionCount": ++defaults.expansionCount
                })
            } else {
                $('#list').empty().append($('<div />').html('<p>There are no spaces available with all your selected facilities. Please try removing one from the list below and search again.</p>').addClass('empty-list'));
                $('.empty-list').append('<ul class="active-facility-filters" />')
                $('.filter-option.facility.active').each(function (index, el) {
                    $('.active-facility-filters').append($(this).clone().on('click', function (event) {
                        event.preventDefault();
                        $(this).toggleClass('active');
                        $('#search').find('.filter-option[data-id="' + $(this).attr('data-id') + '"]').toggleClass('active');
                    }));
                });
                $('.empty-list').append($('<a class="btn search-button"><i class="icon-search"></i>Search</a>').on('click', function (event) {
                    event.preventDefault();
                    $('#search').find('.search-button.btn').trigger('click');
                }))
            }
            //return false;
        }


        if (points.length == 0 && expanding == false) {
            return false;
        }

        if ($('#near-me-btn').hasClass('active')) {
            console.log('get distance');
            $.each(points, function (key, value) {

                if (points[key].lat !== null && points[key].lng !== null) {
                    getDistance(userLoc, {lat: Number(points[key].lat), lng: Number(points[key].lng)}, function (dist) {
                        points[key].distance = dist;
                        distCount++;
                        if (distCount == points.length) {
                            orderSpaces();
                            loadMap();
                            loadList();

                        }
                    });
                } else {
                    distCount++;
                    if (distCount == points.length) {
                        orderSpaces();
                        loadMap();
                        loadList();
                    }
                }
                points[key].link = '#/space/' + points[key].id + '/' + (points[key].name).replace(' ', '-');
            });
        } else {
            $.each(points, function (key, value) {
                points[key].link = '#/space/' + points[key].id + '/' + (points[key].name).replace(' ', '-');
            });
            if ($('#search').html() == '') {
                loadSearch();

            }
            //orderSpaces();
            loadMap();
            loadList();
        }

    });
    loadSpacesInProgress = false;
}

function cleanData(data) {
    var foundIds = [],
        ret = [],
        allIds = [];
    console.log('clean data', data.sort(sortNumber), data.length);
    for (var i = 0; i < data.length; i++) {
        allIds.push(data[i].id);
        if (foundIds.indexOf(data[i].id) == -1) {
            ret.push(data[i]);
            foundIds.push(data[i].id);
        }
    }
    console.log('all ids', allIds.sort(sortNumber), allIds.length);
    console.log('cleaned data', ret.length);
    return ret;
}

function sortNumber(a, b) {
    return a - b;
}

function showLoginScreen(container, data) {
    var $con = $(container);
    var tData = {};
    $.extend(tData, data);

    $('<div />')
        .addClass('login-screen')
        .html(parseTemplate('login', tData))
        .appendTo($con);
    $($con.parents('div')[$con.parents('div').length - 1]).scrollTop(0);

}

function loadSearch() {
    $.ajax(domain + 'spaces/filters.json?callback=?', {
        cache: false,
        dataType: 'json',
        method: 'GET'
    })
        .done(function (data) {
            //console.log('loaded search');
            $('#search').append(parseTemplate('search', data));
        })
}

function checkMarker(data, checks) {
    var match = true;
    $.each(checks, function (key, val) {
        if (data[key] != val) {
            match = false;
            return false;
        }
    });
    return match;
}
function findMarkers(data, checks) {
    var ret = {spaces: []};
    $.each(data, function (key) {
        if (checkMarker(data[key], checks)) {
            data[key]._jsid = key;
            ret.spaces.push(data[key]);
        }
    });
    if (ret.spaces.length > 1) {
        ret.lat = ret.spaces[0].lat;
        ret.lng = ret.spaces[0].lng;

        for (var i = 0; i < ret.spaces.length; i++) {
            if (ret.spaces[i].library !== "") {
                ret['group_name'] = ret.spaces[i].library;
                break;
            }
        }

        if (ret['group_name'] == null) {
            ret['group_name'] = String(ret.spaces[0].address).substring(0, String(ret.spaces[0].address).indexOf(','));
        }

        ret.spaces[0].group_name = ret['group_name'];

        console.log(ret);
    }

    return ret
}
/*---------- map --------------*/
function loadMap(options) {
    $('.current-status').html('map');
    var defaults = {
        inactiveColor: inactiveColor,
        activeColor: activeColor
    };
    $.extend(defaults, options);


    $.each(points, function (key) {
        if (points[key].marker !== undefined) return true;
        //console.log('add new point', points[key]);
        if (points[key].lat == null || points[key].lng == null) {
            return true;
        }

        if ($.type(points[key].lat) == 'string') {
            points[key].lat = Number(points[key].lat);
        }
        if ($.type(points[key].lng) == 'string') {
            points[key].lng = Number(points[key].lng);
        }
        var markers = findMarkers(points, {'lat': points[key].lat, 'lng': points[key].lng}),
            isMultiMarker = markers.spaces.length > 1 ? true : false;

        var marker = new google.maps.Marker({
            position: {'lat': Number(points[key].lat), 'lng': Number(points[key].lng)},
            icon: (isMultiMarker ? multiMarkerSymbol : markerSymbol),
            //animation: google.maps.Animation.DROP
        });

        marker.icon.fillColor = markerColor(points[key].space_type);

        for (var i = 0; i < markers.spaces.length; i++) {
            points[markers.spaces[i]._jsid].marker = marker;
        }
        points[key].marker = marker;
        var contentString;

        if (isMultiMarker) {
            points[key].spaces = markers.spaces;
            points[key].template = 'mapMulti';
            contentString = parseTemplate('mapMulti', points[key]);
        } else {
            points[key].template = 'mapSingle';
            //console.log(points[key]);
            contentString = parseTemplate('mapSingle', points[key]);
        }

        var infowindow = new InfoBubble({
            content: contentString,
            shadowStyle: 0,
            padding: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 0,
            arrowSize: 10,
            borderWidth: 0,
            //borderColor: '#2c2c2c',
            padding: 12,
            disableAutoPan: false,
            hideCloseButton: false,
            //maxWidth:($(window).width() * 0.9),
            //maxHeight:($(window).height() * 0.6),
            //arrowPosition: 50,
            backgroundClassName: 'map-info-bubble',
            disableAnimation: true,
            arrowStyle: 0
        });
        points[key].mapSummary = infowindow;

        marker.setMap(map);

        google.maps.event.addListener(marker, 'click', function () {
            systemEvent = true;
            if (openPoints.length > 0) {
                for (var i = 0; i < openPoints.length; i++) {
                    points[openPoints[i]].mapSummary.close();
                    points[openPoints[i]].marker.icon.fillColor = markerColor(points[openPoints[i]].space_type);
                    points[openPoints[i]].marker.setZIndex(0);
                    points[openPoints[i]].marker.setMap(map);
                    openPoints.splice(i, 1);
                }
            }
            if ($('#bubble-' + points[key].id).length == 0) {
                setTimeout(function () {
                    systemEvent = true;
                    var parent = $('#bubble-' + points[key].id).parent();
                    $('#bubble-' + points[key].id).remove();
                    parent.parents('.infoBubble').css('width', $('#map').width() * 0.8);
                    points[key].mapSummary.open();
                    $(parent).append(parseTemplate(points[key].template, points[key]));
                    parent.parents('.infoBubble').css('width', $('#map').width() * 0.8);
                }, 100);
            } else {
                var parent = $('#bubble-' + points[key].id).parent();
                parent.parents('.infoBubble').css('width', $('#map').width() * 0.8);
            }


            infowindow.open(map, marker);
            //this.icon.fillColor = defaults.activeColor;
            this.setZIndex(100);
            this.setMap(map);
            openPoints.push(key);
        });
        google.maps.event.addListener(infowindow, 'closeclick', function () {
            marker.icon.fillColor = markerColor(points[key].space_type);
            marker.setZIndex(0);
            marker.setMap(map);
            openPoints = [];
        });
    });
    if (openPoints.length == 1) {
        //points[openPoints[0]].marker.icon.fillColor = activeColor;
    }
    $map.find('.map-meta').remove();
    if (currView == 'small') {
        $map.prepend(
            $('<div class="map-meta" />').append('<span class="spaces-count">' + pointsInView().length + '/' + totalSpaceCount + '</span>')
        );
        if (pointsInView().length < totalSpaceCount) {
            //console.info($map.find('.map-meta'))
            $map.find('.map-meta').append(
                $('<a href="#" class="map-load-spaces-link">Load ' + ((totalSpaceCount - pointsInView().length) > queryLimit ? queryLimit : totalSpaceCount - pointsInView().length) + ' more</a>').on('click', function (event) {
                    $(this).html('<i class="icon-loading"></i>');
                    event.preventDefault();
                    //console.log('pages = ', Math.ceil(totalSpaceCount/queryLimit));
                    //console.log('current page = ', Math.floor(pointsInView().length/queryLimit));
                    if ($.type(prepSearch) == 'function') {
                        var search = prepSearch();
                        search += '&page=' + Math.floor(pointsInView().length / queryLimit + 1);
                        //console.log(search);
                        loadSpaces(
                            {
                                queryString: search,
                                keepData: true,
                                "reset": true
                            }
                        )
                    }
                })
            );
        }
    }

    if (typeof (defaults.callback) == 'function') {
        defaults.callback();
    }
}

function markerColor(space_type) {
    switch (String(space_type).toLowerCase()) {
        case 'bar':
        case 'café':
        case 'restaurant':
            return '#EA7125';
            break;
        case 'lab':
        case 'lecture room':
        case 'library space':
        case 'meeting room':
        case 'seminar room':
            return '#00B1C1';
            break;
        default:
            return '#666666';
    }
}

function loadList(options) {
    $('.current-status').html('list');
    var defaults = {
        inactiveColor: 'rgba(0,0,0,0.6)',
        activeColor: '#e2637c'
    };
    $.extend(defaults, options);
    $list.removeClass('no-spaces');
    $list.find('.empty-list').remove();

    $.each(points, function (key) {
        //check if space already exists, if not add it
        if ($list.find('[data-id=' + points[key].id + ']').length == 0) {
            //console.log(key);
            var space = parseTemplate('list', points[key]);
            $list.append(space);
        }

    });
    $('.more-spaces-link').remove();

    $('.list-footer').remove();
    if (currView == "small") {
        $list.append('<div class="list-footer"><span>&copy; <span class="year"></span> Cambridge University Library </span><a href="/terms.html">Terms &amp; Feedback</a></div>');
        var d = new Date();
        var n = d.getFullYear();
        $('.list-footer .year').html(n);
    }


    $('.list-space>h2>.library').each(function (index, el) {
        var $address = $(this).next('.address');
        if ($(this).html() == "") {
            if ($address.length > 0 && $address.html() !== '') {
                $address.removeClass('hidden').html($address.html().split(/\r\n|\r|\n|,/g)[0]);
                $(this).remove();
            }
        } else {
            $address.remove();
        }
    });
    $('.list-space').each(function () {
        var desc = $(this).find('.description').html();
        if ($(this).find('.exclude-array').html() == '') {
            $(this).find('.excluded-search').remove();
        } else if ($(this).find('.exclude-array').length > 0 && $(this).attr('data-expanded') == undefined) {
            var str = '' + $(this).find('.excluded-value:last').html();
            if (str !== '') {
                str = str.substring(0, str.length - 1);
                $(this).find('.excluded-value:last').html(str);
            }
            $(this).attr('data-expanded', $(this).find('.excluded-value').length);
        }

        //console.log(desc);
        //$(this).find('.description').html(desc.substr(0, desc.lastIndexOf(' ')) + '...');
        $(this).hover(function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (!$(this).hasClass('hover')) {
                $(this).addClass('hover')
                var space = findMarkers(points, {'id': $(this).data('id')}).spaces[0];
                if (currView !== 'small') {
                    for (var i = 0; i < points.length; i++) {
                        points[i].marker.setOptions({'opacity': 0.25});
                        points[i].marker.setMap(map);
                    }
                }

                if (space.marker !== undefined && space.marker.icon !== undefined) {
                    //space.marker.icon.fillColor = activeColor;
                    space.marker.setOptions({'opacity': 1});
                    space.marker.setZIndex(10000);
                    space.marker.setMap(map);
                }
            }

            /* Act on the event */
        }, function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (!!$(this).hasClass('hover')) {
                $(this).removeClass('hover')
                var space = findMarkers(points, {'id': $(this).data('id')}).spaces[0];
                if (!$(this).hasClass('clicked')) {
                    for (var i = 0; i < points.length; i++) {
                        points[i].marker.setOptions({'opacity': 1});
                        points[i].marker.setMap(map);
                    }
                    if (space.marker !== undefined && space.marker.icon !== undefined) {
                        space.marker.icon.fillColor = markerColor(space.space_type);
                        space.marker.setOptions({'opacity': 1});
                        space.marker.setZIndex(0);
                        space.marker.setMap(map);
                    }
                }

            }
        }).on('click', function (event) {
            event.preventDefault();
            $this = $(this);
            $this.addClass('clicked')
            setTimeout(function () {
                $this.removeClass('clicked');
            }, 400);
            $this.trigger('mouseout')
            window.location.hash = $(this).data('link');
            /* Act on the event */
        });
        ;
    })
    for (var i = 0; i < exclude.total; i++) {
        //console.log('add title', i, $list.find('.list-space[data-expanded="' + (i+1) + '"]:first'));
        if ($list.find('.list-space[data-expanded="' + (i + 1) + '"]:first').prev('div').is('.extended-description')) {
            continue;
        }
        $list.find('.list-space[data-expanded="' + (i + 1) + '"]:first').before('<div class="extended-description"><b>Your search criteria returned no exact matches.</b> <br /> Below are spaces not including: ' + $list.find('.list-space[data-expanded="' + (i + 1) + '"]:first').find('.exclude-array').html() + '</div>');
        var str = "" + $list.find('.extended-description:last').html();
        var ax = str.lastIndexOf(',');
        if (ax != -1) {
            str = str.substring(0, ax) + ' or ' + str.substring(ax + 1);
        }
        $list.find('.extended-description:last').html(str);
    }
    //$list.find('.exclude-array:first')
    pointsInView();
    $list.find('.list-meta').remove();
    $list.prepend(
        $('<div class="list-meta" />').append('<span class="spaces-count">Showing ' + pointsInView().length + ' of ' + totalSpaceCount + ' results.</span>')
    );
    if (pointsInView().length < totalSpaceCount) {
        $list.find('.list-meta').append(
            $('<a href="#" class="more-spaces-link">Load ' + ((totalSpaceCount - pointsInView().length) > queryLimit ? queryLimit : totalSpaceCount - pointsInView().length) + ' more</a>').on('click', function (event) {
                $(this).html('<i class="icon-loading"></i>');
                event.preventDefault();
                //console.log('pages = ', Math.ceil(totalSpaceCount/queryLimit));
                //console.log('current page = ', Math.floor(pointsInView().length/queryLimit));
                if ($.type(prepSearch) == 'function') {
                    var search = lastQuery;
                    search += '&page=' + Math.floor(pointsInView().length / queryLimit + 1);
                    //console.log(search);
                    loadSpaces(
                        {
                            queryString: search,
                            keepData: true,
                            expanded: exclude
                            //clearSpaces:true
                        }
                    )
                }
            })
        );
    }
    $list.find('.list-meta').width($list.width());
    if (typeof (defaults.callback) == 'function') {
        defaults.callback();
    }
}

function loadTemplates(options) {
    var defaults = {};
    $.extend(defaults, options);

    $.each(templates, function (key) {
        templates[key].template = $('#'+templates[key].id).html();
        
    });
    console.log(templates);
    defaults.callback();
}

function parseTemplate(t, data, partial) {
    //console.log("parse template", t, data, partial);
    if (t == undefined) {
        return false;
    }

    var r = new RegExp('(#{.*\\[.*\\].*})', "g"),
        arrays,
        template,
        matches,
        limit = null,
        icon = null,
        attr = null,
        raw = null,
        transform = null;

    if (partial == true) {
        template = t;
    } else {
        template = templates[t].template;
    }

    arrays = template.match(r);
    if (arrays !== null) {
        for (var i = 0; i < arrays.length; i++) {
            var r = new RegExp('(#{(.*)\\[(.*)\\](.*?)})', "g");
            var match = r.exec(arrays[i]);

            if (match !== null && match !== match[4] !== undefined) {
                limit = match[4].match(/.*limit="(.*)".*/);
                if (limit !== null) {
                    limit = Number(limit[1]);
                } else {
                    limit = null;
                }
            }

            if (match !== null && match[2] !== undefined) {
                var str = convertToValue(match[3], data[match[2]], {"limit": limit, "icon": icon, "attr": attr});
                template = template.replace(match[1], str);
            }

        }
    }
    r = new RegExp('(#{(.*?)})', "g")
    matches = template.match(r);
    if (matches !== null) {
        for (var i = 0; i < matches.length; i++) {
            limit = matches[i].match(/.*limit="(.*?)".*/);
            value = matches[i].match(/.*value="(.*?)".*/);
            attr = matches[i].match(/.*attr="(.*?)".*/);
            transform = matches[i].match(/.*transform="(.*?)".*/);
            icon = matches[i].match(/.*icon.*/);
            raw = matches[i].match(/.*raw.*/);
            if (icon !== null) {
                icon = true;
            }
            if (raw !== null) {
                raw = true;
            }
            if (limit !== null) {
                limit = Number(limit[1]);
            }
            if (attr !== null) {
                attr = attr[1];
            }
            if (transform !== null) {
                transform = transform[1];
            }
            if (value !== null) {
                value = value[1];
            }
            var key = ''
            if (limit !== null || icon !== null || attr !== null || value !== null || raw !== null) {
                key = matches[i].match(/#{(.*)\(.*}/);
            } else {
                key = matches[i].match(/#{(.*)}/);
            }
            //console.log(matches[i], data, key, icon);
            if (key == null) {
                key = matches[i].match(/#{(.*)}/);
            }
            if (key !== null) {
                var str = convertToValue(matches[i], data[key[1]], {
                    "limit": limit,
                    "icon": icon,
                    "attr": attr,
                    "value": value,
                    "raw": raw,
                    "transform": transform
                });
                template = template.replace(matches[i], str);
            }


        }
    }


    return template;
}


function convertToValue(t, data, options) {
    if ($.type(data) == 'array') {
        var temp = '';
        for (var i = 0; i < data.length; i++) {
            var str = t;
            if ($.type(data[i]) == 'object' || $.type(data[i]) == 'array') {
                if (!!options.raw) {
                    str = data[i];
                } else {
                    str = parseTemplate(t, data[i], true);
                }

            } else {
                var searchIconMap = searchArray(iconMap, data[i]);
                if (searchIconMap !== -1) {
                    str = str.replace(/#{value}/g, iconMap[searchIconMap][1]);
                    str = str.replace(/#{attr}/g, String(iconMap[searchIconMap][0].replace(/ /g, '-')).toLowerCase());
                    str = str.replace(/#{icon}/g, iconMap[searchIconMap][2]);
                } else {
                    str = str.replace(/#{value}/g, data[i].replace(/(.*?)/, ''));
                    str = str.replace(/#{attr}/g, data[i]);
                }
            }
            temp += str;
            if (options.limit !== null && i >= (options.limit - 1)) {
                break;
            }
        }

        return temp;

    } else if ($.type(data) == 'object') {
        var temp = t;
        if (!!options.raw) {
            //console.log(data);
            return JSON.stringify(data);
        }
        if (options.value !== null) {
            if (options.limit !== null) {
                temp = data[options.value].substr(0, options.limit);
            } else {
                temp = data[options.value];
            }
        } else {
            $.each(data, function (key, value) {
                if (options.limit !== null) {
                    temp = temp.replace('/#{' + key + '.*}/g', String(value).substr(0, options.limit));
                } else {
                    temp = temp.replace('/#{' + key + '.*}/g', value);
                }

            });
        }

        return temp;
    } else {
        if (data !== undefined && data !== null && data !== 'null') {
            if (options.limit !== null) {
                data = String(data).substr(0, options.limit)
            }
            if (options.attr !== null) {
                data = String(data).replace(' ', options.attr)
            }
            if (options.transform == 'lowercase') {
                data = String(data).toLowerCase();
            }
            if (options.transform == 'uppercase') {
                data = String(data).toUpperCase();
            }
            if (!!options.icon) {
                var searchIconMap = searchArray(iconMap, data);
                if (searchIconMap !== -1) {
                    data = iconMap[searchIconMap][2];
                }
            }
            return data;
        }
        return '';
    }

}

function searchArray(haystack, needle) {
    var ret = -1;
    for (var i = 0; i < haystack.length; i++) {
        if ($.type(haystack[i]) == 'array') {
            for (var j = 0; j < haystack[i].length; j++) {
                if (String(haystack[i][j]).toLowerCase() == String(needle).toLowerCase()) {
                    ret = i;
                    break;
                }
            }
            if (ret !== -1) break;
        } else {
            if (String(haystack[i]).toLowerCase() == String(needle).toLowerCase()) {
                ret = i;
                break;
            }
        }
    }
    return ret;
}

function getDistance(origin, dest, callback) {
    //console.log('get distance()');
    var service = new google.maps.DistanceMatrixService();
    if ($.type(origin) !== 'array') {
        var temp = [];
        temp.push(origin);
        origin = temp;
    }
    if ($.type(dest) !== 'array') {
        var temp = [];
        temp.push(dest);
        dest = temp;
    }
    service.getDistanceMatrix({
        origins: origin,
        destinations: dest,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        travelMode: google.maps.TravelMode.WALKING
    }, function (response, status) {
        if (status == "OK") {
            if ($.type(callback) == 'function') {
                if (response.rows[0].elements[0].distance !== undefined) {
                    callback(response.rows[0].elements[0].distance.text);
                } else {
                    callback();
                }

            }
        } else {
            return '';
        }

    });
}

function loginCallback(response) {
    //console.log('login callback success');
    //console.log(response);
    if (response.status == 'success') {
        if ($.type(response) == 'object') {
            userDetails = response;
        }
        $(window).trigger('login_callback');
    }


}

function orderSpaces() {
    points.sort(function (a, b) {
        aNum = parseFloat(a.distance);
        bNum = parseFloat(b.distance);
        ////console.log(parseFloat(a.distance), parseFloat(b.distance));
        if (a.distance == undefined) return 1;
        if (b.distance == undefined) return -1;

        if (a.distance.indexOf('ft') !== -1) {
            aNum = Number("0.0" + parseFloat(a.distance));
        }
        if (b.distance.indexOf('ft') !== -1) {
            bNum = Number("0.0" + parseFloat(b.distance));
        }
        //check if we have one in feet and one in miles - return feet
        //console.log(a.distance.indexOf('ft'), b.distance.indexOf('ft'));

        if (aNum > bNum) {
            return 1;
        } else if (aNum < bNum) {
            return -1;
        } else {
            return 0;
        }
        //else compare the number from both as they will be the same unit of measurement


    });
}

function pointsInView() {
    if (map == undefined) return [];
    var mapHidden = false;
    var mapBounds = map.getBounds(),
        ret = [],
        ne = mapBounds.getNorthEast(),
        sw = mapBounds.getSouthWest(),
        bounds = [
            new google.maps.LatLng(ne.lat(), sw.lng()),
            new google.maps.LatLng(ne.lat(), ne.lng()),
            new google.maps.LatLng(sw.lat(), ne.lng()),
            new google.maps.LatLng(sw.lat(), sw.lng())
        ];
    console.log(mapBounds);
    /*//console.log(mapBounds.Ia.G, mapBounds.Ca.G);
    //console.log(mapBounds.Ia.j, mapBounds.Ca.G)
    //console.log(mapBounds.Ia.j, mapBounds.Ca.j)
    //console.log(mapBounds.Ia.G, mapBounds.Ca.j)*/
    var poly = new google.maps.Polygon({
        paths: bounds,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#FF0000',
        fillOpacity: 0.35
    });
    //poly.setMap(map);

    for (var i = 0; i < points.length; i++) {
        ////console.log(points[i].lat, points[i].lng);
        if (points[i].lat !== null || points[i].lng !== null) {
            var latlng = new google.maps.LatLng(points[i].lat, points[i].lng);
            ////console.log(latlng);
            var contains = google.maps.geometry.poly.containsLocation(latlng, poly);
            if (!!contains) {
                $list.find('[data-id=' + points[i].id + ']').slideDown(300);
                ret.push(points[i]);
            } else {
                $list.find('[data-id=' + points[i].id + ']').slideUp(300);
            }
        }

    }
    //console.log('points in view', ret);
    if (ret.length > 0 && $('.loading-cover').length > 0) {
        $(window).trigger('initialLoadComplete')
    }
    return ret;
}

function lineDistance(point1, point2) {
    var xs = 0;
    var ys = 0;

    xs = point2.x - point1.x;
    xs = xs * xs;

    ys = point2.y - point1.y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
}
