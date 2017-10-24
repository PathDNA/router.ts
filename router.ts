const pushState = window.history.pushState;

export class Router {
	private routes: Route[];

	constructor() {
		this.routes = new Array();

		window.history.pushState = (_: any, title: string, url: string) => this.handlePop(title, url);
		window.onpopstate = () => this.handlePop("", window.location.pathname);
	}

	private handlePop(title: string, url: string) {
		const parts = url.split("/");
		this.routes.some((r: Route): boolean => r.Match(parts));
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
