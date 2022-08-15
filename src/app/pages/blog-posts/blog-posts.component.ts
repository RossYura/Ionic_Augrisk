import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { GhostBlogService } from 'src/app/core/services/ghost-blog.service';
import { BlogPostModel } from 'src/app/core/models/blog-post.model';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Location } from '@angular/common';

@Component({
  selector: 'blog-posts',
  templateUrl: './blog-posts.component.html',
  styleUrls: ['./blog-posts.component.scss'],
})
export class BlogPostsComponent implements OnInit {

  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  public blogPosts: BlogPostModel[] = [];
  public currentPage: number = 1;
  public totalPages: number;
  public totalPagesArray: number[];
  private resultsPerPage = 10;
  public isLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isEmpty$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private ghostService: GhostBlogService, private _location: Location) { }

  ngOnInit() {
    // Populating table data
    this.getPosts();
  }

  goBack() {
		this._location.back();
	}

  /** Infinite scroll */
  async loadData(event) {
    this.currentPage++;
    await this.getPosts();
    event.target.complete();
  }
  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }


	/**
	 * getPosts
	 * Retrieve blog posts from Ghost
	 */
  public getPosts(currentPage = this.currentPage): Promise<BlogPostModel[]> {
    return new Promise((resolve, reject) => {
      this.isLoading$.next(true);

      // putting 'all' on second attribute, limit, loads all posts
      this.ghostService.getBlogPosts(currentPage, this.resultsPerPage, null, null, null, 'tags').subscribe(
        results => {
          if (!environment.production) console.log('Blog posts are ', results);
          this.blogPosts = [...this.blogPosts, ...results.posts];
          if (!environment.production) console.log('Consolidated blog posts are', this.blogPosts);
          // Handling pagination
          const resultsLength = (results.posts) ? results.posts.length : 0;
          const totalLength = (this.blogPosts) ? this.blogPosts.length : 0;
          if (results.posts.length === 0) {
            this.isEmpty$.next(false);
            resolve();
          }
          this.currentPage = results.meta.pagination.page;
          this.totalPages = results.meta.pagination.pages;
          this.totalPagesArray = [];
          for (let i = 1; i <= this.totalPages; i++) {
            this.totalPagesArray.push(i);
          }
          // console.log(this.totalPagesArray);
          // Show no data if no results
          this.isEmpty$.next((resultsLength) ? false : true);
          this.isLoading$.next(false);
          resolve();
        },
        error => {
          this.isLoading$.next(false);
          if (error.status === 501) {
            // Retry attempt after 3 seconds
            setTimeout(() => {
              this.getPosts();
            }, 3000);
          }
          console.error("Blog error: ", error);
          reject(error);
        });
    })
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    // filter mechanics if we add search on top
  }

}
