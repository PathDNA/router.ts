import * as entry from "node_modules/pubsub/entry";

const pushState = window.history.pushState;

export class Router {
	private routes: Route[];
	private e: entry.Entry<string>;

	constructor() {
		this.routes = new Array();
		this.e = new entry.Entry<string>("url")

		window.history.pushState = (_: any, title: string, url: string) => this.handlePop(title, url);
		window.onpopstate = () => this.handlePop("", window.location.pathname);
	}

	private handlePop(title: string, url: string) {
		const parts = url.split("/");
		const match = this.routes.some((r: Route): boolean => r.Match(parts));
		if (match) {
			this.e.Put(url);
		}
		
		pushState.apply(history, [null, title, url]);
	}

	Put(route: string, title: string, ...handlers: Handler[]) {
		const r = new Route(route, title, handlers);
		this.routes.push(r);
		r.Match(window.location.pathname.split("/"));
	}

	Pop(title: string, url: string) {
		window.history.pushState(null, title, url);
	}

	OnPop(fn: PopFn) {
		this.e.Sub((_: string, url: string) => fn(url));
	}
}

export class Route {
	private title: string;
	private parts: string[];
	private handlers: Handler[];

	constructor(route: string, title: string, handlers: Handler[]) {
		this.title = title;
		this.parts = route.split("/");
		this.handlers = handlers;
	}

	Match(destinationParts: string[]): boolean {
		if (this.parts.length !== destinationParts.length) {
			return false;
		}

		const p = <Params>{};
		const noMatch = this.parts.some((part: string, i: number): boolean => {
			const dp = destinationParts[i];
			if (dp === part) {
				// This is a basic match, return early
				return false;
			}

			if (part.indexOf(":") === 0) {
				// This is a wildcard, set Params then return
				p[part.substr(1, part.length - 1)] = dp;
				return false;
			}

			// This is not a basic match nor a wildcard, bail out playa!
			return true;
		});

		if (noMatch) {
			return false;
		}

		document.title = this.title;
		this.handlers.forEach((h: Handler) => h(p));
		return true;
	}
}

export type Handler = (p: Params) => void;

export type Params = { [key: string]: string }

export type PopFn = (url: string) => boolean;