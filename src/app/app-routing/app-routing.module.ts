import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ChallengesComponent } from '../challenges.component';
import { AdminComponent } from '../admin/admin.component';

import { AdminGuard } from '../admin.guard';

const appRoutes: Routes = [
  { path: 'challenges', component: ChallengesComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: '', redirectTo: '/challenges', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
  ]
})
export class AppRoutingModule {}