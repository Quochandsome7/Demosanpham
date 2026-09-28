<script lang="ts">
  import { page } from '$app/stores';
  import { icons } from '$lib/icons';
  
  let slug = $derived($page.params.slug);
  
  const pages: Record<string, { title: string, icon: string, content: string }> = {
    'doi-tra': {
      title: 'Chính sách đổi trả',
      icon: icons.refresh,
      content: `
        <h3>1. Điều kiện đổi trả</h3>
        <p>Sản phẩm bị lỗi do nhà sản xuất trong vòng 30 ngày kể từ ngày nhận hàng.</p>
        <p>Sản phẩm phải còn nguyên vẹn, đầy đủ phụ kiện, hộp, tem bảo hành và hóa đơn mua hàng.</p>
        
        <h3>2. Trường hợp không được đổi trả</h3>
        <p>Sản phẩm bị hư hỏng do lỗi của người sử dụng (rơi vỡ, vào nước, sai điện áp...).</p>
        <p>Thiếu phụ kiện hoặc mất hộp.</p>
        <p>Sản phẩm đã bị can thiệp phần mềm hoặc phần cứng bởi bên thứ ba.</p>
        
        <h3>3. Quy trình đổi trả</h3>
        <p>Quý khách vui lòng liên hệ hotline hoặc đến trực tiếp cửa hàng để được hỗ trợ kiểm tra và tiến hành đổi trả.</p>
      `
    },
    'bao-hanh': {
      title: 'Chính sách bảo hành',
      icon: icons.shield,
      content: `
        <h3>1. Thời gian bảo hành</h3>
        <p>Bảo hành chính hãng 12-24 tháng (tùy theo dòng sản phẩm).</p>
        <p>Bảo hành phụ kiện kèm theo 6 tháng.</p>
        
        <h3>2. Điều kiện bảo hành</h3>
        <p>Sản phẩm còn trong thời hạn bảo hành.</p>
        <p>Lỗi kỹ thuật từ phía nhà sản xuất.</p>
        <p>Tem bảo hành phải còn nguyên vẹn, không bị rách, cạo sửa.</p>
        
        <h3>3. Địa điểm bảo hành</h3>
        <p>Quý khách có thể mang sản phẩm đến các Trung tâm bảo hành chính hãng hoặc trực tiếp tại Cellphone X.</p>
      `
    },
    'van-chuyen': {
      title: 'Chính sách vận chuyển',
      icon: icons.truck,
      content: `
        <h3>1. Phí vận chuyển</h3>
        <p>Miễn phí vận chuyển cho tất cả đơn hàng trên 500.000đ.</p>
        <p>Phí vận chuyển 30.000đ cho đơn hàng dưới 500.000đ.</p>
        
        <h3>2. Thời gian giao hàng</h3>
        <p>Nội thành TP. Thái Nguyên: Giao hàng trong ngày (2-4 tiếng).</p>
        <p>Các tỉnh thành khác: 2-4 ngày làm việc.</p>
        
        <h3>3. Kiểm tra hàng</h3>
        <p>Quý khách được quyền đồng kiểm cùng bưu tá khi nhận hàng. Lưu ý không bóc seal sản phẩm khi chưa thanh toán (đối với hàng nguyên seal).</p>
      `
    },
    'faq': {
      title: 'Câu hỏi thường gặp (FAQ)',
      icon: icons.help,
      content: `
        <h3>1. Cellphone X có bán hàng trả góp không?</h3>
        <p>Có, chúng tôi hỗ trợ trả góp 0% qua thẻ tín dụng và trả góp qua các công ty tài chính (Home Credit, HD Saison...) với thủ tục đơn giản.</p>
        
        <h3>2. Mua hàng online có an toàn không?</h3>
        <p>Hoàn toàn an toàn. Chúng tôi đóng gói kỹ lưỡng và có bảo hiểm hàng hóa trong quá trình vận chuyển.</p>
        
        <h3>3. Làm sao để kiểm tra tình trạng đơn hàng?</h3>
        <p>Bạn có thể liên hệ hotline hoặc nhắn tin qua Fanpage cung cấp mã đơn hàng để nhân viên hỗ trợ kiểm tra lộ trình chi tiết.</p>
      `
    }
  };
  
  let pageData = $derived(pages[slug] || { title: 'Không tìm thấy trang', icon: icons.help, content: '<p>Nội dung trang không tồn tại.</p>' });
</script>

<div class="container mx-auto px-4 py-12 max-w-4xl">
  <div class="bg-dark-900/50 rounded-3xl border border-white/5 p-8 lg:p-12 backdrop-blur-sm">
    <div class="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
      <div class="w-12 h-12 text-cyber-500 bg-cyber-500/10 rounded-2xl flex items-center justify-center p-3">
        {@html pageData.icon}
      </div>
      <h1 class="text-3xl font-bold text-white tracking-tight">{pageData.title}</h1>
    </div>
    
    <div class="prose prose-invert prose-cyber max-w-none">
      {@html pageData.content}
    </div>
    
    <div class="mt-12 pt-6 border-t border-white/10">
      <a href="/" class="inline-flex items-center gap-2 text-cyber-500 hover:text-cyber-400 font-medium transition-colors">
        <div class="w-5 h-5">{@html icons.arrowLeft}</div>
        Về trang chủ
      </a>
    </div>
  </div>
</div>

<style>
  :global(.prose-cyber h3) {
    color: #fff;
    font-size: 1.25rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  :global(.prose-cyber p) {
    color: #94a3b8;
    margin-bottom: 1rem;
    line-height: 1.6;
  }
</style>
