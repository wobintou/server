/*
 * @author ChandraLee
 */

(function (domeApp, undefined) {
	'use strict';
	if (typeof domeApp === 'undefined') return;

	domeApp.controller('DeployManageCtr', ['$scope', '$domeDeploy', '$domeCluster', '$timeout', '$state', '$modal', '$domeData', '$domePublic', function ($scope, $domeDeploy, $domeCluster, $timeout, $state, $modal, $domeData, $domePublic) {
		$scope.$emit('pageTitle', {
			title: '部署',
			descrition: '在这里您可以把项目镜像部署到运行环境中。此外，您还可以对现有部署进行监控和管理。',
			mod: 'deployManage'
		});
		$scope.showSelect = true;
		var stateInfo = $state.$current.name;
		if (stateInfo.indexOf('deployAllManage') === -1) {
			$scope.showSelect = false;
		}else{
			$scope.showSelect = true;
		}
		$scope.isLoading = true;
		$scope.tabActive = [{
			active: false
		}, {
			active: false
		}];
		var stateInfo = $state.$current.name;
		if (stateInfo.indexOf('user') !== -1) {
			$scope.tabActive[1].active = true;
		}else {
			$scope.tabActive[0].active = true;
		}
		$scope.resourceType = 'DEPLOY_COLLECTION'; //add by gb	
		$scope.collectionName = $state.params.name;
		$scope.resourceId = $state.params.id;
		$scope.collectionId = $state.params.id;
		$scope.deloyList = [];

		var cluserList = [],
			timeout;
		var clusterService = $domeCluster.getInstance('ClusterService');
		$scope.selectOption = {};
		$scope.selectOption.status = {
			ALL: true,
			DEPLOYING: false,
			RUNNING: false,
			// AB_TEST: false,
			STOP: false,
			ERROR: false,
			STOPPING: false,
			BACKROLLING: false,
			UPDATING: false,
			UPSCALING: false,
			DOWNSCALING: false,
			ABORTING: false,
			BACKROLL_ABORTED: false,
			UPDATE_ABORTED: false
		};
		$scope.selectOption.env = {
			ALL: true,
			PROD: false,
			TEST: false
		};
		$scope.selectOption.namespace = {
			ALL: true
		};
		$scope.selectOption.cluster = {
			ALL: true
		};
		// 登录用户角色
		$scope.$on('signalResourceCurrentUserRole', function (event, msg) {
          	var userRole = msg;
          	if(userRole === 'MASTER' || userRole === 'DEVELOPER') {
				$scope.isCreate = true;
			}else {
				$scope.isCreate = false;
			}
			if (userRole === 'MASTER') {
				$scope.isMigrate = true;
			}else {
				$scope.isMigrate = false;
			}
        });
		$scope.deloyList = [];
		var init = function () {
			var collectionId = $state.params.id;
			if ($state.current.name.indexOf('deployManage') !== -1) {
				$domeDeploy.deployService.getListByCollectionId(collectionId).then(function (res) {
					var thisDeploy, cpuPercent, memPercent;
					if (res.data.result) {
						$scope.deloyList = res.data.result;
						for (var i = 0, l = $scope.deloyList.length; i < l; i++) {
							thisDeploy = $scope.deloyList[i];
							cpuPercent = thisDeploy.cpuTotal > 0 ? (thisDeploy.cpuUsed / thisDeploy.cpuTotal * 100).toFixed(2) : '0.00';
							memPercent = thisDeploy.memoryTotal > 0 ? (thisDeploy.memoryUsed / thisDeploy.memoryTotal * 100).toFixed(2) : '0.00';
							if (thisDeploy.serviceDnsName) {
								thisDeploy.dnsName = thisDeploy.serviceDnsName;
							} else {
								thisDeploy.dnsName = '无';
							}
							if (cpuPercent > memPercent) {
								thisDeploy.compare = 'cpu';
								thisDeploy.comparePercent = cpuPercent;
							} else {
								thisDeploy.compare = 'memory';
								thisDeploy.comparePercent = memPercent;
							}
						}
					}
				}).finally(function () {
					$scope.isLoading = false;
					if (timeout) {
						$timeout.cancel(timeout);
					}
					timeout = $timeout(init, 4000);
				});
			}else if ($state.current.name === 'deployAllManage') {
				$domeDeploy.deployService.getList().then(function (res) {
					var thisDeploy, cpuPercent, memPercent;
					if (res.data.result) {
						$scope.deloyList = res.data.result;
						for (var i = 0, l = $scope.deloyList.length; i < l; i++) {
							thisDeploy = $scope.deloyList[i];
							cpuPercent = thisDeploy.cpuTotal > 0 ? (thisDeploy.cpuUsed / thisDeploy.cpuTotal * 100).toFixed(2) : '0.00';
							memPercent = thisDeploy.memoryTotal > 0 ? (thisDeploy.memoryUsed / thisDeploy.memoryTotal * 100).toFixed(2) : '0.00';
							if (thisDeploy.serviceDnsName) {
								thisDeploy.dnsName = thisDeploy.serviceDnsName;
							} else {
								thisDeploy.dnsName = '无';
							}
							if (cpuPercent > memPercent) {
								thisDeploy.compare = 'cpu';
								thisDeploy.comparePercent = cpuPercent;
							} else {
								thisDeploy.compare = 'memory';
								thisDeploy.comparePercent = memPercent;
							}
						}
					}
				}).finally(function () {
					$scope.isLoading = false;
					if (timeout) {
						$timeout.cancel(timeout);
					}
					timeout = $timeout(init, 4000);
				});
			}
		};
		init();

		var getNamespace = function (clusterId) {
			clusterService.getNamespace(clusterId).then(function (res) {
				var namespaceList = res.data.result || [];
				for (var j = 0, l = namespaceList.length; j < l; j++) {
					if (!$scope.selectOption.namespace[namespaceList[j].name]) {
						$scope.selectOption.namespace[namespaceList[j].name] = false;
					}
				}
			});
		};
		var getNamespaceList = function () {
			var i, l;
			$scope.selectOption.namespace = {
				ALL: true
			};
			if ($scope.selectOption.cluster.ALL) {
				for (i = 0, l = cluserList.length; i < l; i++) {
					getNamespace(cluserList[i].id);
				}
			} else {
				angular.forEach($scope.selectOption.cluster, function (value, key) {
					if (key !== 'ALL' && value) {
						for (i = 0, l = cluserList.length; i < l; i++) {
							if (cluserList[i].name === key) {
								getNamespace(cluserList[i].id);
								break;
							}
						}
					}
				});
			}
		};
		clusterService.getData().then(function (res) {
			cluserList = res.data.result || [];
			getNamespaceList('all');
			for (var i = 0, l = cluserList.length; i < l; i++) {
				$scope.selectOption.cluster[cluserList[i].name] = false;
			}
		});
		$scope.toggleShowSelect = function () {
			$scope.showSelect = !$scope.showSelect;
		};
		$scope.toggleAll = function (type) {
			angular.forEach($scope.selectOption[type], function (value, key) {
				$scope.selectOption[type][key] = false;
			});
			$scope.selectOption[type].ALL = true;
			if (type === 'cluster') {
				getNamespaceList('all');
			}
		};
		$scope.toggleSelect = function (type, item) {
			var hasNone = true;
			$scope.selectOption[type][item] = !$scope.selectOption[type][item];
			if (!$scope.selectOption[type][item]) {
				angular.forEach($scope.selectOption[type], function (value, key) {
					if (key !== 'ALL' && $scope.selectOption[type][key] && hasNone) {
						hasNone = false;
					}
				});
				if (hasNone) {
					$scope.toggleAll(type);
				}
			} else if ($scope.selectOption[type].ALL) {
				$scope.selectOption[type].ALL = false;
			}
			if (type === 'cluster') {
				getNamespaceList(item);
			}
		};
		$scope.$on('$destroy', function (argument) {
			if (timeout) {
				$timeout.cancel(timeout);
			}
		});
		$scope.openMigrateDeployModal = function (deployId,deployName) {
			$modal.open({
				animation: true,
				templateUrl: 'migrateDeployModal.html',
				controller: 'migrateDeployModalCtr',
				size: 'md',
				resolve: {
					deployId: function() {
						return deployId;
					},
					deployName: function () {
						return deployName;
					},
					collectionName: function () {
						return $scope.collectionName;
					}
				}
			});
		};
	}]).controller('migrateDeployModalCtr', ['$scope', '$state','$domePublic', '$domeDeployCollection', 'deployId', 'deployName','collectionName', '$modalInstance', '$util', function ($scope, $state, $domePublic, $domeDeployCollection, deployId, deployName, collectionName, $modalInstance, $util) {
		$scope.migrateDeployName = deployName;
		$scope.migrateCollectionName = collectionName;
		$scope.migrateCollectionId = '';
		$scope.deployCollectionList = [];
		$scope.isLoading = true;
		$scope.parseDate = $util.getPageDate;
		$domeDeployCollection.deployCollectionService.getDeployCollection().then(function (res) {
			var collectionList = res.data.result || [];
			for (var i=0; i < collectionList.length; i++) {
				if (collectionList[i].role === "MASTER") {
					$scope.deployCollectionList.push(collectionList[i]);
				}
			}

		}).finally(function () {
			$scope.isLoading = false;
		});
		$scope.toggleCollectionName = function ($index,name,id) {
			$scope.migrateCollectionName = name;
			$scope.migrateCollectionId = id;
		};
		$scope.save = function() {
			$domeDeployCollection.deployCollectionService.migrateDeploy(deployId,$scope.migrateCollectionId).then(function(){
				$state.go('deployManage',{
					id: $scope.migrateCollectionId,
					name: $scope.migrateCollectionName
				});
			}, function(error) {
				$domePublic.openWarning('迁移失败');
				$modalInstance.dismiss('cancel');
			}).finally(function() {
				$modalInstance.dismiss('cancel');
			});
		};
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}]);
})(window.domeApp);