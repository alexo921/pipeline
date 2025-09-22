/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/profile/route";
exports.ids = ["app/api/auth/profile/route"];
exports.modules = {

/***/ "(rsc)/./app/api/auth/profile/route.ts":
/*!***************************************!*\
  !*** ./app/api/auth/profile/route.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_api_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/api-utils */ \"(rsc)/./lib/api-utils.ts\");\n\n\nasync function GET(request) {\n    try {\n        // Forward the request to backend with cookies\n        const response = await fetch((0,_lib_api_utils__WEBPACK_IMPORTED_MODULE_1__.getApiUrl)(\"/auth/profile\"), {\n            method: \"GET\",\n            headers: {\n                \"Content-Type\": \"application/json\",\n                // Forward the cookie header\n                \"Cookie\": request.headers.get(\"cookie\") || \"\"\n            }\n        });\n        const result = await response.json();\n        if (!response.ok) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                message: result.message || \"Failed to get profile\"\n            }, {\n                status: response.status\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(result);\n    } catch (error) {\n        console.error(\"API Route Error [profile]:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            message: \"Internal Server Error\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvcHJvZmlsZS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBd0Q7QUFDWjtBQUVyQyxlQUFlRSxJQUFJQyxPQUFvQjtJQUM1QyxJQUFJO1FBQ0YsOENBQThDO1FBQzlDLE1BQU1DLFdBQVcsTUFBTUMsTUFDckJKLHlEQUFTQSxDQUFDLGtCQUNWO1lBQ0VLLFFBQVE7WUFDUkMsU0FBUztnQkFDUCxnQkFBZ0I7Z0JBQ2hCLDRCQUE0QjtnQkFDNUIsVUFBVUosUUFBUUksT0FBTyxDQUFDQyxHQUFHLENBQUMsYUFBYTtZQUM3QztRQUNGO1FBR0YsTUFBTUMsU0FBUyxNQUFNTCxTQUFTTSxJQUFJO1FBRWxDLElBQUksQ0FBQ04sU0FBU08sRUFBRSxFQUFFO1lBQ2hCLE9BQU9YLHFEQUFZQSxDQUFDVSxJQUFJLENBQ3RCO2dCQUFFRSxTQUFTSCxPQUFPRyxPQUFPLElBQUk7WUFBd0IsR0FDckQ7Z0JBQUVDLFFBQVFULFNBQVNTLE1BQU07WUFBQztRQUU5QjtRQUVBLE9BQU9iLHFEQUFZQSxDQUFDVSxJQUFJLENBQUNEO0lBQzNCLEVBQUUsT0FBT0ssT0FBTztRQUNkQyxRQUFRRCxLQUFLLENBQUMsOEJBQThCQTtRQUM1QyxPQUFPZCxxREFBWUEsQ0FBQ1UsSUFBSSxDQUN0QjtZQUFFRSxTQUFTO1FBQXdCLEdBQ25DO1lBQUVDLFFBQVE7UUFBSTtJQUVsQjtBQUNGIiwic291cmNlcyI6WyIvaG9tZS91YnVudHUvcGlwZWxpbmUvZnJvbnRlbmQvd2ViLWRhc2hib2FyZC9hcHAvYXBpL2F1dGgvcHJvZmlsZS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyBnZXRBcGlVcmwgfSBmcm9tIFwiQC9saWIvYXBpLXV0aWxzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICAvLyBGb3J3YXJkIHRoZSByZXF1ZXN0IHRvIGJhY2tlbmQgd2l0aCBjb29raWVzXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcbiAgICAgIGdldEFwaVVybChcIi9hdXRoL3Byb2ZpbGVcIiksXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIC8vIEZvcndhcmQgdGhlIGNvb2tpZSBoZWFkZXJcbiAgICAgICAgICBcIkNvb2tpZVwiOiByZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiY29va2llXCIpIHx8IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgICAgeyBtZXNzYWdlOiByZXN1bHQubWVzc2FnZSB8fCBcIkZhaWxlZCB0byBnZXQgcHJvZmlsZVwiIH0sXG4gICAgICAgIHsgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocmVzdWx0KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiQVBJIFJvdXRlIEVycm9yIFtwcm9maWxlXTpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgIHsgbWVzc2FnZTogXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIiB9LFxuICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgKTtcbiAgfVxufSAiXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiZ2V0QXBpVXJsIiwiR0VUIiwicmVxdWVzdCIsInJlc3BvbnNlIiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiZ2V0IiwicmVzdWx0IiwianNvbiIsIm9rIiwibWVzc2FnZSIsInN0YXR1cyIsImVycm9yIiwiY29uc29sZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/profile/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/api-utils.ts":
/*!**************************!*\
  !*** ./lib/api-utils.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getApiUrl: () => (/* binding */ getApiUrl)\n/* harmony export */ });\n/**\n * Utility function to get the correct API URL for different environments\n * In production: https://api.pipelineworkforce.com/... (no /api prefix needed)\n * In local Docker: http://localhost:3001/api/... (backend has global /api prefix)\n */ function getApiUrl(endpoint) {\n    const baseUrl = \"http://localhost:3001\";\n    // For local Docker development, the backend has a global /api prefix\n    // So we need to add /api before the endpoint\n    if ( true && baseUrl?.includes('localhost')) {\n        return `${baseUrl}/api${endpoint}`;\n    }\n    // For production, just append the endpoint\n    return `${baseUrl}${endpoint}`;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXBpLXV0aWxzLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztDQUlDLEdBQ00sU0FBU0EsVUFBVUMsUUFBZ0I7SUFDeEMsTUFBTUMsVUFBVUMsdUJBQStCO0lBRS9DLHFFQUFxRTtJQUNyRSw2Q0FBNkM7SUFDN0MsSUFBSUEsS0FBc0MsSUFBSUQsU0FBU0ksU0FBUyxjQUFjO1FBQzVFLE9BQU8sR0FBR0osUUFBUSxJQUFJLEVBQUVELFVBQVU7SUFDcEM7SUFFQSwyQ0FBMkM7SUFDM0MsT0FBTyxHQUFHQyxVQUFVRCxVQUFVO0FBQ2hDIiwic291cmNlcyI6WyIvaG9tZS91YnVudHUvcGlwZWxpbmUvZnJvbnRlbmQvd2ViLWRhc2hib2FyZC9saWIvYXBpLXV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBnZXQgdGhlIGNvcnJlY3QgQVBJIFVSTCBmb3IgZGlmZmVyZW50IGVudmlyb25tZW50c1xuICogSW4gcHJvZHVjdGlvbjogaHR0cHM6Ly9hcGkucGlwZWxpbmV3b3JrZm9yY2UuY29tLy4uLiAobm8gL2FwaSBwcmVmaXggbmVlZGVkKVxuICogSW4gbG9jYWwgRG9ja2VyOiBodHRwOi8vbG9jYWxob3N0OjMwMDEvYXBpLy4uLiAoYmFja2VuZCBoYXMgZ2xvYmFsIC9hcGkgcHJlZml4KVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXBpVXJsKGVuZHBvaW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfQVBJX1VSTDtcbiAgXG4gIC8vIEZvciBsb2NhbCBEb2NrZXIgZGV2ZWxvcG1lbnQsIHRoZSBiYWNrZW5kIGhhcyBhIGdsb2JhbCAvYXBpIHByZWZpeFxuICAvLyBTbyB3ZSBuZWVkIHRvIGFkZCAvYXBpIGJlZm9yZSB0aGUgZW5kcG9pbnRcbiAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnICYmIGJhc2VVcmw/LmluY2x1ZGVzKCdsb2NhbGhvc3QnKSkge1xuICAgIHJldHVybiBgJHtiYXNlVXJsfS9hcGkke2VuZHBvaW50fWA7XG4gIH1cbiAgXG4gIC8vIEZvciBwcm9kdWN0aW9uLCBqdXN0IGFwcGVuZCB0aGUgZW5kcG9pbnRcbiAgcmV0dXJuIGAke2Jhc2VVcmx9JHtlbmRwb2ludH1gO1xufSAiXSwibmFtZXMiOlsiZ2V0QXBpVXJsIiwiZW5kcG9pbnQiLCJiYXNlVXJsIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX0FQSV9VUkwiLCJpbmNsdWRlcyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/api-utils.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2Fprofile%2Froute&page=%2Fapi%2Fauth%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fprofile%2Froute.ts&appDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2Fprofile%2Froute&page=%2Fapi%2Fauth%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fprofile%2Froute.ts&appDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _home_ubuntu_pipeline_frontend_web_dashboard_app_api_auth_profile_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/profile/route.ts */ \"(rsc)/./app/api/auth/profile/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/profile/route\",\n        pathname: \"/api/auth/profile\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/profile/route\"\n    },\n    resolvedPagePath: \"/home/ubuntu/pipeline/frontend/web-dashboard/app/api/auth/profile/route.ts\",\n    nextConfigOutput,\n    userland: _home_ubuntu_pipeline_frontend_web_dashboard_app_api_auth_profile_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGcHJvZmlsZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYXV0aCUyRnByb2ZpbGUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhdXRoJTJGcHJvZmlsZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZob21lJTJGdWJ1bnR1JTJGcGlwZWxpbmUlMkZmcm9udGVuZCUyRndlYi1kYXNoYm9hcmQlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRmhvbWUlMkZ1YnVudHUlMkZwaXBlbGluZSUyRmZyb250ZW5kJTJGd2ViLWRhc2hib2FyZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQzBCO0FBQ3ZHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvaG9tZS91YnVudHUvcGlwZWxpbmUvZnJvbnRlbmQvd2ViLWRhc2hib2FyZC9hcHAvYXBpL2F1dGgvcHJvZmlsZS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvcHJvZmlsZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvcHJvZmlsZVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9wcm9maWxlL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL2hvbWUvdWJ1bnR1L3BpcGVsaW5lL2Zyb250ZW5kL3dlYi1kYXNoYm9hcmQvYXBwL2FwaS9hdXRoL3Byb2ZpbGUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2Fprofile%2Froute&page=%2Fapi%2Fauth%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fprofile%2Froute.ts&appDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fauth%2Fprofile%2Froute&page=%2Fapi%2Fauth%2Fprofile%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Fprofile%2Froute.ts&appDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2Fhome%2Fubuntu%2Fpipeline%2Ffrontend%2Fweb-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();