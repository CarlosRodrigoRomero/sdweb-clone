import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from "@angular/router";
import { Injectable } from "@angular/core";

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {
  handlers: { [key: string]: DetachedRouteHandle } = {};

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // console.log("shouldDetach", route.data.shouldReuse || false);
    return route.data.shouldReuse || false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    // console.log("TCL: store -> route", route);
    const path = this.getUrl(route);
    // console.log("store -> path", path);
    if (route.data.shouldReuse && path) {
      this.handlers[path] = handle;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // console.log("TCL: shouldAttach", !!this.handlers[this.getUrl(route)]);
    return !!this.handlers[this.getUrl(route)];
  }

  retrieve(route: ActivatedRouteSnapshot): any {
    // console.log("TCL: retrieve -> route", route);
    if (!this.getUrl(route)) {
      return null;
    }
    return this.handlers[this.getUrl(route)];
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    const condition =
      future.routeConfig === curr.routeConfig &&
      JSON.stringify(future.params) === JSON.stringify(curr.params);
    // console.log("shouldReuseRoute -> condition", condition);
    return condition;
  }

  getUrl2(route: ActivatedRouteSnapshot) {
    if (!route.parent.url.join("/") || !route.url.join("/")) {
      return null;
    }
    let url = "";
    if (route.parent.url.join("/")) {
      url += route.parent.url.join("/") + "/";
    }
    if (route.url.join("/")) {
      url += route.url.join("/");
    }
    return url === "" ? null : url;
  }

  private getUrl(route: ActivatedRouteSnapshot) {
    const path = route.routeConfig ? route.routeConfig.path : "";

    const informeId = this.getInformeId(route);

    // const keys = Object.keys(params);

    // keys.forEach((key: string) => {
    //   const reg = new RegExp(`:${key}`);
    //   path = path.replace(reg, params[key]);
    // });
    // return path;
    return informeId.concat("/").concat(path);
  }
  private getInformeId(route: ActivatedRouteSnapshot): string {
    return route.parent
      ? route.parent.params.hasOwnProperty("id")
        ? route.parent.params.id
        : ""
      : "";
  }
}
