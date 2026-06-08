# Supabase 后端集成指南

## 一、创建 Supabase 项目

### 1. 注册 Supabase 账号
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 可以使用 GitHub 账号直接登录

### 2. 创建新项目
1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `closet-app` (或你喜欢的名称)
   - **Database Password**: 设置一个强密码（请记住！）
   - **Region**: 选择离你最近的区域（如 Singapore）
3. 点击 "Create new project"，等待项目初始化完成（约 2 分钟）

### 3. 获取 API 密钥
1. 项目创建后，进入项目仪表板
2. 点击左侧菜单 "Settings" → "API"
3. 记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 二、配置数据库表结构

### 1. 打开 SQL Editor
1. 在 Supabase 项目中，点击左侧菜单 "SQL Editor"
2. 点击 "New query"

### 2. 执行以下 SQL 创建表结构

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表（扩展 Supabase auth.users）
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 衣物表
CREATE TABLE public.clothes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  color TEXT,
  tags TEXT[] DEFAULT '{}',
  suitable_temp TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收纳位置表
CREATE TABLE public.locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  clothes_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 搭配表
CREATE TABLE public.outfits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  item_ids UUID[] DEFAULT '{}',
  rating INTEGER DEFAULT 3,
  suitable_temp TEXT,
  occasion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 设置行级安全策略 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- profiles 表策略
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- clothes 表策略
CREATE POLICY "Users can view own clothes" ON public.clothes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothes" ON public.clothes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothes" ON public.clothes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothes" ON public.clothes
  FOR DELETE USING (auth.uid() = user_id);

-- locations 表策略
CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id);

-- outfits 表策略
CREATE POLICY "Users can view own outfits" ON public.outfits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits" ON public.outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits" ON public.outfits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits" ON public.outfits
  FOR DELETE USING (auth.uid() = user_id);

-- 创建自动创建用户资料的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. 点击 "Run" 执行 SQL

---

## 三、配置认证设置

### 1. 启用 Email 认证
1. 点击左侧菜单 "Authentication" → "Providers"
2. 确保 "Email" 已启用
3. 配置 Email 模板（可选）

### 2. 配置站点 URL（可选）
1. 点击 "Authentication" → "URL Configuration"
2. 设置 Site URL: `http://localhost:3000`
3. 添加 Redirect URLs: `http://localhost:3000/**`

---

## 四、环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**重要**: 请将 `your-project-id` 和 `your-anon-key` 替换为你在步骤 1.3 中获取的实际值。

---

## 五、完成！

现在你可以：
1. 运行 `npm install` 安装依赖
2. 运行 `npm run dev` 启动开发服务器
3. 使用 Supabase 认证登录

---

## 常见问题

### Q: 如何查看数据库数据？
A: 在 Supabase 项目中，点击 "Table Editor" 可以查看和编辑数据。

### Q: 如何重置密码？
A: Supabase 内置了密码重置功能，调用 `supabase.auth.resetPasswordForEmail(email)` 即可。

### Q: 如何添加第三方登录（如 Google）？
A: 在 "Authentication" → "Providers" 中启用 Google，然后配置 OAuth 凭据。

### Q: 数据安全吗？
A: Supabase 使用 PostgreSQL 的行级安全策略 (RLS)，确保用户只能访问自己的数据。
