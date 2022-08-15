import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";
// RxJS
import { Observable } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class GhostBlogService {
	APIUrl = environment.APIGhostUrl;
	APIContentKey = environment.APIGhostContentKey;
	httpOptions = {
		headers: new HttpHeaders({
			"Content-Type": "application/json",
		})
	};
	constructor(private http: HttpClient) { }

	/**
	 * Setting up the HttpHeaders for the request with all params
	 * Check Postman Augurisk-ghost-blog-api > getGhostPosts
	 */
	getURL(page?: number, limit?: 'all' | number, order?: string, filter?: string, formats?: 'html' | 'plaintext' | 'html, plaintext', include?: 'tags' | 'authors' | 'tags, authors'): string {
		let url = this.APIUrl + '/ghost/api/v3/content/posts/?key=' + this.APIContentKey;

		if (page) {
			url += '&page=' + page;
		}

		if (limit) {
			url += '&limit=' + limit;
		}

		if (formats) {
			url += '&formats=' + formats;
		}

		if (include) {
			url += '&include=' + include;
		}

		if (filter) {
			url += '&filter=' + filter;
		}

		if (order) {
			url += '&order=' + order;
		}

		return url;
	}

	/**
	 * Get Blog Posts 
	 * Params:
	 * Check Postman Augurisk-ghost-blog-api > getGhostPosts
	 */
	getBlogPosts(page: number = 1, limit: 'all' | number = 'all', order = 'published_at DESC', filter = null, formats: 'html' | 'plaintext' | 'html, plaintext' = 'html', include = null): Observable<any> {
		const apiURL = this.getURL(page, limit, order, filter, formats, include);
		// console.log('URL IS : ', apiURL);
		return this.http
			.get<any>(apiURL, this.httpOptions);
	}

}
