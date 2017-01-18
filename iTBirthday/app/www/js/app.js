// Ionic Starter App

var serverUrl = "https://1b817994.ngrok.io";
//var serverUrl = "http://localhost:8080";
//var defaultPath = '/app/www/';
var defaultPath = '';

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'itBirthday' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

angular.module('itBirthday', ['ionic', 'ngFileUpload', 'ngPageTitle',
  'itBirthday.login', 'itBirthday.profile', 'itBirthday.statistics',
  'itBirthday.settings', 'itBirthday.facebook', 'itBirthday.outlook'])

  .run(function ($ionicPlatform, $rootScope, Auth, $state) {
    $rootScope.defaultPath = defaultPath;

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
      if (toState.url != '/login') {
        var auth = Auth.getAuth();
        auth.then(function (data) {
          // Success
        }, function (error) {
          console.log("auth error!");
          $state.go('login');
        });
      }
    });

    $ionicPlatform.ready(function () {
      if (window.cordova && window.cordova.plugins.Keyboard) {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

        // Don't remove this line unless you know what you are doing. It stops the viewport
        // from snapping when text inputs are focused. Ionic handles this internally for
        // a much nicer keyboard experience.
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
    });
  })


  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('top'); //bottom - comment to put default

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // login page before showing tabs
      .state('login', {
        url: '/login',
        templateUrl: defaultPath + 'templates/login.html',
        controller: 'LoginCtrl',
        data: {
          pageTitle: 'Login'
        }
      })

      // setup an abstract state for the tabs directive
      .state('tabs', {
        url: '/tabs',
        abstract: true,
        templateUrl: defaultPath + 'templates/tabs.html'
      })

      // Each tab has its own nav history stack:
      .state('tabs.dash', {
        url: '/dash',
        views: {
          'tab-dash': {
            templateUrl: defaultPath + 'templates/tab-dash.html',
            controller: 'StatisticsCtrl'
          }
        },
        data: {
          pageTitle: 'Dashboard'
        }
      })

      // setup an abstract state for the profile tab
      .state('tabs.profile', {
        url: '/profile',
        abstract: true,
        views: {
          'tab-profile': {
            templateUrl: defaultPath + 'templates/tab-profile.html'
          }
        }
      })

      .state('tabs.profile.new', {
        url: '/new',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: defaultPath + 'templates/profile.html',
            controller: 'NewUserCtrl'
          }
        },
        data: {
          pageTitle: 'Novo Perfil'
        }
      })

      .state('tabs.profile.show', {
        url: '/show/:id',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: defaultPath + 'templates/profile.html',
            controller: 'UpdateUserCtrl'
          }
        },
        data: {
          pageTitle: 'Ver Perfil'
        }
      })

      .state('tabs.profile.search', {
        url: '/search',
        views: {
          'inside-profile-tab@tabs.profile': {
            templateUrl: defaultPath + 'templates/search-profile.html',
            controller: 'SearchCtrl'
          }
        },
        data: {
          pageTitle: 'Pesquisar Perfis'
        }
      })

      .state('tabs.settings', {
        url: '/settings',
        views: {
          'tab-settings': {
            templateUrl: defaultPath + 'templates/tab-templates.html',
            controller: 'MsgTemplatesCtrl'
          }
        },
        data: {
          pageTitle: 'Templates'
        }
      })

      .state('tabs.facebook', {
        url: '/facebook',
        views: {
          'tab-facebook': {
            templateUrl: defaultPath + 'templates/facebook.html',
            controller: 'FacebookCtrl'
          }
        },
        data: {
          pageTitle: 'Facebook'
        }
      })

      .state('tabs.outlook', {
        url: '/outlook',
        views: {
          'tab-outlook': {
            templateUrl: defaultPath + 'templates/outlook.html',
            controller: 'OutlookCtrl'
          }
        },
        data: {
          pageTitle: 'Outlook'
        }
      });

    // if none of the above states are matched, use this as the fallback

    $urlRouterProvider.otherwise('/login');
  })

  .service('ionicLoadingService', function ($ionicLoading) {
    var ionicLoadingService = this;
    ionicLoadingService.showLoading = function () {
      var customTemplate = '<ion-spinner icon="dots"></ion-spinner>';
      $ionicLoading.show({
        template: customTemplate,
        hideOnStateChange: true,
        animation: 'fade-in'
      });
    };
    ionicLoadingService.hideLoading = function () {
      $ionicLoading.hide();
    };
  })

  .factory('Auth', function ($http, $q) {
    return {
      getAuth: function () {
        var defer = $q.defer();
        var cookie = localStorage.getItem('session');

        if (cookie != null) {
          var cookie2 = cookie.replace('\"', '');
          return $http.get(serverUrl + '/Session/' + cookie2, function (data) {
            defer.resolve(data);
            return data;
          }).error(function (error) {
            defer.reject(error);
          });

        } else {
          defer.reject();
        }

        return defer.promise;
      }
    }
  });

