import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { IsLoggedOutGuard } from './core/guards/is-logged-out.guard';
import { IsLoggedInGuard } from './core/guards/is-logged-in.guard';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pages',
    pathMatch: 'full',
    canLoad: [IsLoggedInGuard],
		canActivateChild: [IsLoggedInGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then( m => m.AuthModule),
    canActivate: [IsLoggedOutGuard]
  },
  {
    path: 'pages',
    loadChildren: () => import('./pages/pages.module').then( m => m.PagesModule),
    canActivate: [IsLoggedInGuard]
  },
	// { path: "**", redirectTo: "app/error/404", pathMatch: "full" }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    IonicModule,
    HttpClientModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
