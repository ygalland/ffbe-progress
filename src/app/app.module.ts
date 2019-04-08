import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing/app-routing.module';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { firebaseConfig } from '../environments/firebase';
import { AuthService } from './services/auth.service';

import { AppComponent } from './app.component';
import { AdminComponent } from './admin/admin.component';
import { LoginComponent } from './login/login.component';
import { MychallengesEditComponent } from './mychallenges/mychallenges-edit/mychallenges-edit.component';
import { AdminCategoriesComponent } from './admin/admin-categories/admin-categories.component';
import { AdminChallengesComponent } from './admin/admin-challenges/admin-challenges.component';
import { AdminRanksComponent } from './admin/admin-ranks/admin-ranks.component';
import { MychallengesComponent } from './mychallenges/mychallenges.component';
import { RankingComponent } from './ranking/ranking.component';
import { UserComponent } from './user/user.component';

import { AdminGuard } from './guards/admin.guard';

import { LocalizedDatePipe } from './pipes/localized-date.pipe';

import { TranslateModule } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// the second parameter 'fr' is optional
registerLocaleData(localeFr, 'fr');

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MychallengesEditComponent,
    AdminComponent,
    AdminCategoriesComponent,
    AdminChallengesComponent,
    AdminRanksComponent,
    MychallengesComponent,
    RankingComponent,
    UserComponent,
    LocalizedDatePipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    TranslateModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule
  ],
  providers: [
    AuthService,
    AdminGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
