export interface BlogPostModel {
    id: string;
    uuid: string;
    title: string;
    slug: string; // Slug is the reduced URL-Friendly version of the title 
    html: string;
    comment_id: string;
    feature_image: string;
    featured: boolean;
    visibility: string;
    send_email_when_published?: boolean;
    created_at: Date
    updated_at: Date
    published_at: Date
    url: string;
    custom_excerpt?: string;
    excerpt?: string;
    reading_time?: number;
    codeinjection_head?: any;
    codeinjection_foot?: any;
    custom_template?: any;
    canonical_url?: any;
    og_image?: any;
    og_title?: any;
    og_description?: any;
    twitter_image?: any;
    twitter_title?: any;
    twitter_description?: any;
    meta_title?: any;
    meta_description?: any;
    email_subject?: any;

}