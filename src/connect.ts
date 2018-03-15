import {Application} from 'express';
import Route from './route';
import Router from './router';
import transfer from './connect/transfer';
import {trim} from './util/trim';
import {Middleware} from './models/middleware';

export default function connect(app: Application,
                                router: Router,
                                previouxPrefix: string[] = [],
                                previousMiddleware: Middleware[] = []): Route[] {

    let routes: Route[] = [];

    let prefix = [...previouxPrefix];
    if (router.prefix !== null) {
        prefix.push(router.prefix.replace(/^\/|\/$/g, ''));
    }

    /* Transfer each route to Express */
    router.routes.forEach((route: Route) => {
        let path = '';
        if (prefix.length > 0) {
            path += '/' + prefix.join('/');
        }
        if (trim(route.path) !== '') {
            path += '/' + trim(route.path);
        }

        /* Transfer to Express */
        transfer(
            app,
            route.method,
            path,
            [...previousMiddleware, ...router.middleware, ...route.middleware],
            route.controller
        );

        /* Add to routes listing */
        const aggregatedRoute = new Route(route.method, path, route.controller);
        aggregatedRoute.middleware = [...previousMiddleware, ...router.middleware, ...route.middleware];
        aggregatedRoute.name = route.name;
        routes.push(aggregatedRoute);
    });

    /* Recursively transfer routes of each group as well including the parent middleware and prefix */
    router.groups.forEach((group: Router) => {
        routes = [...routes, ...connect(
            app,
            group,
            prefix,
            [...previousMiddleware, ...router.middleware]
        )];
    });

    return routes;
};
